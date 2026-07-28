import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import "./styles/App.css";
import { getAIResponse } from "./services/aiService";

function App() {
  // Load saved chats from localStorage when the app first starts
  const [chats, setChats] = useState(() => {
    const savedChats =
      localStorage.getItem("chats");

    if (savedChats) {
      return JSON.parse(savedChats);
    }

    return [];
  });

  // Restore the previously active chat if it still exists
  const [activeChatId, setActiveChatId] =
    useState(() => {
      const savedActiveChatId =
        localStorage.getItem("activeChatId");

      const activeChatStillExists = chats.some(
        (chat) =>
          chat.id === savedActiveChatId
      );

      if (activeChatStillExists) {
        return savedActiveChatId;
      }

      // Otherwise select the first saved chat
      return chats[0]?.id ?? null;
    });

  // Tracks whether an AI response is currently streaming
  const [isLoading, setIsLoading] =
    useState(false);

  // Stores request error messages
  const [error, setError] = useState("");

  // Controls the mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  // Stores the current AbortController
  // so the active request can be stopped
  const abortControllerRef = useRef(null);

  // Find the currently selected chat
  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  // Use an empty array when no chat is selected
  const messages = activeChat?.messages ?? [];

  // Add a new user message and stream the AI response
  async function handleAddMessage(newMessage) {
    setError("");
    setIsLoading(true);

    // Create a controller for this request
    // so the user can stop the response
    const controller = new AbortController();

    abortControllerRef.current = controller;

    // Use the first user message as the chat title
    const newTitle =
      newMessage.content.length > 30
        ? `${newMessage.content.slice(
            0,
            30
          )}...`
        : newMessage.content;

    // The request may use an existing chat
    // or create a new chat
    let targetChatId = activeChatId;
    let conversationMessages = [];

    // Create a new chat only when the first
    // user message is submitted
    if (!targetChatId) {
      targetChatId = crypto.randomUUID();

      conversationMessages = [newMessage];

      const newChat = {
        id: targetChatId,
        title: newTitle,
        messages: conversationMessages,
      };

      setChats((prevChats) => [
        ...prevChats,
        newChat,
      ]);

      setActiveChatId(targetChatId);
    } else {
      // Find the active chat before adding
      // the new user message
      const targetChat = chats.find(
        (chat) => chat.id === targetChatId
      );

      // Include all previous messages
      // so the AI keeps conversation context
      conversationMessages = [
        ...(targetChat?.messages ?? []),
        newMessage,
      ];

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id !== targetChatId) {
            return chat;
          }

          // Check whether this chat already
          // contains a user message
          const hasUserMessage =
            chat.messages.some(
              (message) =>
                message.role === "user"
            );

          return {
            ...chat,

            // Only set the automatic title
            // for the first user message
            title: hasUserMessage
              ? chat.title
              : newTitle,

            messages: conversationMessages,
          };
        })
      );
    }

    // Create an empty assistant message
    // before streaming begins
    const assistantMessageId =
      crypto.randomUUID();

    const emptyAssistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    // Add the empty assistant message
    // to the correct chat
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === targetChatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                emptyAssistantMessage,
              ],
            }
          : chat
      )
    );

    try {
      // Remove local-only properties such as id
      // before sending messages to the backend
      const apiMessages =
        conversationMessages.map(
          (message) => ({
            role: message.role,
            content: message.content,
          })
        );

      await getAIResponse(
        apiMessages,

        // This callback runs every time
        // a new streamed chunk arrives
        (chunk) => {
          setChats((prevChats) =>
            prevChats.map((chat) => {
              if (
                chat.id !== targetChatId
              ) {
                return chat;
              }

              return {
                ...chat,
                messages: chat.messages.map(
                  (message) =>
                    message.id ===
                    assistantMessageId
                      ? {
                          ...message,

                          // Add each new chunk
                          // to the existing response
                          content:
                            message.content +
                            chunk,
                        }
                      : message
                ),
              };
            })
          );
        },

        // Pass the abort signal to fetch
        controller.signal
      );
    } catch (error) {
      // AbortError means the user intentionally
      // pressed Stop, so do not show an error
      if (error.name === "AbortError") {
        return;
      }

      console.error(error);

      // Remove the empty or failed assistant message
      // when a real request error occurs
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === targetChatId
            ? {
                ...chat,
                messages:
                  chat.messages.filter(
                    (message) =>
                      message.id !==
                      assistantMessageId
                  ),
              }
            : chat
        )
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      // Clear the finished request controller
      abortControllerRef.current = null;

      setIsLoading(false);
    }
  }

  // Stop the currently streaming AI response
  function handleStopGenerating() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  // Regenerate the latest assistant response
  async function handleRegenerateResponse() {
    // Prevent regeneration when no chat exists
    // or another request is already running
    if (!activeChatId || isLoading) {
      return;
    }

    // Find the currently active chat
    const currentChat = chats.find(
      (chat) => chat.id === activeChatId
    );

    if (!currentChat) {
      return;
    }

    // Find the position of the latest
    // assistant response
    const latestAssistantIndex =
      currentChat.messages.findLastIndex(
        (message) =>
          message.role === "assistant"
      );

    // Stop if the chat has no assistant response
    if (latestAssistantIndex === -1) {
      return;
    }

    // Keep everything before the latest
    // assistant response
    //
    // Example:
    // user -> assistant -> user -> assistant
    //
    // After slice:
    // user -> assistant -> user
    const conversationMessages =
      currentChat.messages.slice(
        0,
        latestAssistantIndex
      );

    // Get the last remaining message
    const latestConversationMessage =
      conversationMessages[
        conversationMessages.length - 1
      ];

    // Regeneration should only happen when
    // the message before the assistant response
    // is a user message
    if (
      !latestConversationMessage ||
      latestConversationMessage.role !==
        "user"
    ) {
      return;
    }

    setError("");
    setIsLoading(true);

    // Create a new controller for
    // the regeneration request
    const controller =
      new AbortController();

    abortControllerRef.current = controller;

    // Save the original messages
    // so they can be restored after a real error
    const originalMessages =
      currentChat.messages;

    // Create a new replacement
    // assistant message
    const assistantMessageId =
      crypto.randomUUID();

    const emptyAssistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    // Remove the old assistant response
    // and insert an empty replacement
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [
                ...conversationMessages,
                emptyAssistantMessage,
              ],
            }
          : chat
      )
    );

    try {
      // Prepare the earlier conversation
      // for the backend API
      const apiMessages =
        conversationMessages.map(
          (message) => ({
            role: message.role,
            content: message.content,
          })
        );

      await getAIResponse(
        apiMessages,

        // Append each streamed chunk
        // to the replacement assistant message
        (chunk) => {
          setChats((prevChats) =>
            prevChats.map((chat) => {
              if (
                chat.id !== activeChatId
              ) {
                return chat;
              }

              return {
                ...chat,
                messages: chat.messages.map(
                  (message) =>
                    message.id ===
                    assistantMessageId
                      ? {
                          ...message,
                          content:
                            message.content +
                            chunk,
                        }
                      : message
                ),
              };
            })
          );
        },

        controller.signal
      );
    } catch (error) {
      // Keep the partial regenerated response
      // when the user presses Stop
      if (error.name === "AbortError") {
        return;
      }

      console.error(error);

      // Restore the previous assistant response
      // when an actual request error happens
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages:
                  originalMessages,
              }
            : chat
        )
      );

      setError(
        "Something went wrong while regenerating the response."
      );
    } finally {
      abortControllerRef.current = null;

      setIsLoading(false);
    }
  }

  // Open the empty new-chat screen
  // without storing a fake chat
  function handleNewChat() {
    handleStopGenerating();

    setError("");
    setIsLoading(false);
    setActiveChatId(null);

    // Close sidebar automatically on mobile
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }

  // Remove every message from
  // the currently active chat
  function handleClearChat() {
    handleStopGenerating();

    setError("");
    setIsLoading(false);

    if (!activeChatId) {
      return;
    }

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [],
            }
          : chat
      )
    );
  }

  // Change the currently selected chat
  function handleSelectChat(chatId) {
    handleStopGenerating();

    setActiveChatId(chatId);
    setError("");

    // Close the sidebar after selecting
    // a chat on mobile
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }

  // Delete one chat
  function handleDeleteChat(chatId) {
    handleStopGenerating();

    setError("");
    setIsLoading(false);

    setChats((prevChats) => {
      const remainingChats =
        prevChats.filter(
          (chat) => chat.id !== chatId
        );

      // When the deleted chat was active,
      // select another chat if one remains
      if (chatId === activeChatId) {
        setActiveChatId(
          remainingChats[0]?.id ?? null
        );
      }

      return remainingChats;
    });
  }

  // Update the title of one chat
  function handleRenameChat(
    chatId,
    newTitle
  ) {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title: newTitle,
            }
          : chat
      )
    );
  }

  // Save chats whenever the chats state changes
  useEffect(() => {
    localStorage.setItem(
      "chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  // Save the selected chat whenever it changes
  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem(
        "activeChatId",
        activeChatId
      );
    } else {
      localStorage.removeItem(
        "activeChatId"
      );
    }
  }, [activeChatId]);

  async function handleEditMessage(
  messageId,
  newContent
) {
  if (isLoading || !activeChatId) {
    return;
  }

  const currentChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  if (!currentChat) {
    return;
  }

  const userMessageIndex =
    currentChat.messages.findIndex(
      (message) =>
        message.id === messageId &&
        message.role === "user"
    );

  if (userMessageIndex === -1) {
    return;
  }

  const trimmedContent =
    newContent.trim();

  if (!trimmedContent) {
    return;
  }

  // Save the original chat in case the request fails
  const originalMessages =
    currentChat.messages;

  const originalTitle =
    currentChat.title;

  /*
    Keep all messages up to the edited user message.

    Anything after it is removed because it belongs
    to the old version of the question.
  */
  const conversationMessages =
    currentChat.messages
      .slice(0, userMessageIndex + 1)
      .map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: trimmedContent,
            }
          : message
      );

  const assistantMessageId =
    crypto.randomUUID();

  const assistantMessage = {
    id: assistantMessageId,
    role: "assistant",
    content: "",
  };

  const controller =
    new AbortController();

  abortControllerRef.current =
    controller;

  setIsLoading(true);
  setError(null);

  // Update the edited message and add an empty
  // assistant message for streaming
  setChats((previousChats) =>
    previousChats.map((chat) => {
      if (chat.id !== activeChatId) {
        return chat;
      }

      return {
        ...chat,

        // Update title when the first user message
        // in the conversation was edited
        title:
          userMessageIndex === 0
            ? trimmedContent.slice(0, 30)
            : chat.title,

        messages: [
          ...conversationMessages,
          assistantMessage,
        ],
      };
    })
  );

  try {
    await getAIResponse(
      conversationMessages.map(
        ({ role, content }) => ({
          role,
          content,
        })
      ),

      // Add every streamed chunk to the
      // replacement assistant message
      (chunk) => {
        setChats((previousChats) =>
          previousChats.map((chat) => {
            if (
              chat.id !== activeChatId
            ) {
              return chat;
            }

            return {
              ...chat,
              messages:
                chat.messages.map(
                  (message) =>
                    message.id ===
                    assistantMessageId
                      ? {
                          ...message,
                          content:
                            message.content +
                            chunk,
                        }
                      : message
                ),
            };
          })
        );
      },

      controller.signal
    );
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(
        "Failed to edit message:",
        error
      );

      setError(
        "Unable to generate a new response."
      );

      // Restore the conversation before editing
      setChats((previousChats) =>
        previousChats.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                title: originalTitle,
                messages:
                  originalMessages,
              }
            : chat
        )
      );
    }
  } finally {
    setIsLoading(false);

    if (
      abortControllerRef.current ===
      controller
    ) {
      abortControllerRef.current = null;
    }
  }
}
  // Open or close the mobile sidebar
  function handleToggleSidebar() {
    setIsSidebarOpen(
      (previousState) =>
        !previousState
    );
  }

  // Close the mobile sidebar
  function handleCloseSidebar() {
    setIsSidebarOpen(false);
  }

 
  return (
    <div className="app">
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={
          handleToggleSidebar
        }
      />

      <main className="app-layout">
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onClearChat={handleClearChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          isSidebarOpen={isSidebarOpen}
        />

        <button
          type="button"
          className={`sidebar-backdrop ${
            isSidebarOpen
              ? "sidebar-backdrop-visible"
              : ""
          }`}
          onClick={handleCloseSidebar}
          aria-label="Close sidebar"
          tabIndex={
            isSidebarOpen ? 0 : -1
          }
        />

       <ChatWindow
  messages={activeChat?.messages ?? []}
  onAddMessage={handleAddMessage}
  onRegenerateResponse={
    handleRegenerateResponse
  }
  onEditMessage={handleEditMessage}
  isLoading={isLoading}
  error={error}
/>
      </main>
    </div>
  );
}

export default App;