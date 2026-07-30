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
  // Restore persisted conversations on initial load.
  const [chats, setChats] = useState(() => {
    const savedChats =
      localStorage.getItem("chats");

    return savedChats
      ? JSON.parse(savedChats)
      : [];
  });

  // Restore the user's saved theme preference.
  const [theme, setTheme] = useState(() => {
    return (
      localStorage.getItem("theme") ??
      "light"
    );
  });

  // Restore the previously active conversation when possible.
  const [activeChatId, setActiveChatId] =
    useState(() => {
      const savedActiveChatId =
        localStorage.getItem(
          "activeChatId"
        );

      const activeChatStillExists =
        chats.some(
          (chat) =>
            chat.id ===
            savedActiveChatId
        );

      if (activeChatStillExists) {
        return savedActiveChatId;
      }

      return chats[0]?.id ?? null;
    });

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // Stores the failed operation so the user can retry it.
  const [retryRequest, setRetryRequest] =
    useState(null);

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  // Holds the active request so streaming can be cancelled.
  const abortControllerRef =
    useRef(null);

  const activeChat = chats.find(
    (chat) =>
      chat.id === activeChatId
  );

  async function handleAddMessage(
    newMessage
  ) {
    if (
      isLoading ||
      !newMessage?.content?.trim()
    ) {
      return;
    }

    setRetryRequest(null);
    setError("");
    setIsLoading(true);

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    const messageContent =
      newMessage.content.trim();

    const preparedMessage = {
      ...newMessage,
      content: messageContent,
    };

    const newTitle =
      messageContent.length > 30
        ? `${messageContent.slice(
            0,
            30
          )}...`
        : messageContent;

    let targetChatId = activeChatId;
    let conversationMessages = [];

    // Create a conversation only after the first user message.
    if (!targetChatId) {
      targetChatId =
        crypto.randomUUID();

      conversationMessages = [
        preparedMessage,
      ];

      const newChat = {
        id: targetChatId,
        title: newTitle,
        messages:
          conversationMessages,
      };

      setChats((previousChats) => [
        ...previousChats,
        newChat,
      ]);

      setActiveChatId(targetChatId);
    } else {
      const targetChat = chats.find(
        (chat) =>
          chat.id === targetChatId
      );

      conversationMessages = [
        ...(targetChat?.messages ?? []),
        preparedMessage,
      ];

      setChats((previousChats) =>
        previousChats.map((chat) => {
          if (
            chat.id !== targetChatId
          ) {
            return chat;
          }

          const hasUserMessage =
            chat.messages.some(
              (message) =>
                message.role ===
                "user"
            );

          return {
            ...chat,

            title: hasUserMessage
              ? chat.title
              : newTitle,

            messages:
              conversationMessages,
          };
        })
      );
    }

    const assistantMessageId =
      crypto.randomUUID();

    const emptyAssistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    // Insert a placeholder that receives streamed response chunks.
    setChats((previousChats) =>
      previousChats.map((chat) =>
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
      const apiMessages =
        conversationMessages.map(
          ({ role, content }) => ({
            role,
            content,
          })
        );

      await getAIResponse(
        apiMessages,

        (chunk) => {
          setChats(
            (previousChats) =>
              previousChats.map(
                (chat) => {
                  if (
                    chat.id !==
                    targetChatId
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
                }
              )
          );
        },

        controller.signal
      );
    } catch (requestError) {
      if (
        requestError.name ===
        "AbortError"
      ) {
        return;
      }

      console.error(requestError);

      // Remove the failed assistant placeholder while keeping the user message.
      setChats((previousChats) =>
        previousChats.map((chat) =>
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
        requestError.message ||
          "Something went wrong. Please try again."
      );

      setRetryRequest({
        type: "regenerate",
      });
    } finally {
      if (
        abortControllerRef.current ===
        controller
      ) {
        abortControllerRef.current =
          null;

        setIsLoading(false);
      }
    }
  }

  function handleStopGenerating() {
    abortControllerRef.current?.abort();
  }

  async function handleRegenerateResponse() {
    if (
      !activeChatId ||
      isLoading
    ) {
      return;
    }

    const currentChat = chats.find(
      (chat) =>
        chat.id === activeChatId
    );

    if (!currentChat) {
      return;
    }

    const latestAssistantIndex =
      currentChat.messages.findLastIndex(
        (message) =>
          message.role ===
          "assistant"
      );

    /*
     * A failed first response leaves the conversation ending
     * with a user message and no assistant message.
     */
    const conversationMessages =
      latestAssistantIndex === -1
        ? currentChat.messages
        : currentChat.messages.slice(
            0,
            latestAssistantIndex
          );

    const latestConversationMessage =
      conversationMessages.at(-1);

    if (
      !latestConversationMessage ||
      latestConversationMessage.role !==
        "user"
    ) {
      return;
    }

    setRetryRequest(null);
    setError("");
    setIsLoading(true);

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    // Preserve the current response for error recovery.
    const originalMessages =
      currentChat.messages;

    const assistantMessageId =
      crypto.randomUUID();

    const emptyAssistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    setChats((previousChats) =>
      previousChats.map((chat) =>
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
      const apiMessages =
        conversationMessages.map(
          ({ role, content }) => ({
            role,
            content,
          })
        );

      await getAIResponse(
        apiMessages,

        (chunk) => {
          setChats(
            (previousChats) =>
              previousChats.map(
                (chat) => {
                  if (
                    chat.id !==
                    activeChatId
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
                }
              )
          );
        },

        controller.signal
      );
    } catch (requestError) {
      if (
        requestError.name ===
        "AbortError"
      ) {
        return;
      }

      console.error(requestError);

      // Restore the previous conversation if regeneration fails.
      setChats((previousChats) =>
        previousChats.map((chat) =>
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
        requestError.message ||
          "Something went wrong while regenerating the response."
      );

      setRetryRequest({
        type: "regenerate",
      });
    } finally {
      if (
        abortControllerRef.current ===
        controller
      ) {
        abortControllerRef.current =
          null;

        setIsLoading(false);
      }
    }
  }

  async function handleEditMessage(
    messageId,
    newContent
  ) {
    if (
      isLoading ||
      !activeChatId
    ) {
      return;
    }

    const currentChat = chats.find(
      (chat) =>
        chat.id === activeChatId
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

    if (
      userMessageIndex === -1
    ) {
      return;
    }

    const trimmedContent =
      newContent.trim();

    if (!trimmedContent) {
      return;
    }

    setRetryRequest(null);

    // Preserve the original conversation for error recovery.
    const originalMessages =
      currentChat.messages;

    const originalTitle =
      currentChat.title;

    // Remove responses generated after the edited message.
    const conversationMessages =
      currentChat.messages
        .slice(
          0,
          userMessageIndex + 1
        )
        .map((message) =>
          message.id === messageId
            ? {
                ...message,
                content:
                  trimmedContent,
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
    setError("");

    setChats((previousChats) =>
      previousChats.map((chat) => {
        if (
          chat.id !== activeChatId
        ) {
          return chat;
        }

        return {
          ...chat,

          title:
            userMessageIndex === 0
              ? trimmedContent.length >
                30
                ? `${trimmedContent.slice(
                    0,
                    30
                  )}...`
                : trimmedContent
              : chat.title,

          messages: [
            ...conversationMessages,
            assistantMessage,
          ],
        };
      })
    );

    try {
      const apiMessages =
        conversationMessages.map(
          ({ role, content }) => ({
            role,
            content,
          })
        );

      await getAIResponse(
        apiMessages,

        (chunk) => {
          setChats(
            (previousChats) =>
              previousChats.map(
                (chat) => {
                  if (
                    chat.id !==
                    activeChatId
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
                }
              )
          );
        },

        controller.signal
      );
    } catch (requestError) {
      if (
        requestError.name !==
        "AbortError"
      ) {
        console.error(
          "Failed to edit message:",
          requestError
        );

        setError(
          requestError.message ||
            "Unable to generate a new response."
        );

        setRetryRequest({
          type: "edit",
          messageId,
          newContent: trimmedContent,
        });

        // Restore the original conversation if the request fails.
        setChats((previousChats) =>
          previousChats.map((chat) =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  title:
                    originalTitle,
                  messages:
                    originalMessages,
                }
              : chat
          )
        );
      }
    } finally {
      if (
        abortControllerRef.current ===
        controller
      ) {
        abortControllerRef.current =
          null;

        setIsLoading(false);
      }
    }
  }

  function handleRetry() {
    if (
      !retryRequest ||
      isLoading
    ) {
      return;
    }

    if (
      retryRequest.type === "edit"
    ) {
      handleEditMessage(
        retryRequest.messageId,
        retryRequest.newContent
      );

      return;
    }

    handleRegenerateResponse();
  }

  function handleNewChat() {
    handleStopGenerating();

    setError("");
    setRetryRequest(null);
    setIsLoading(false);
    setActiveChatId(null);

    if (
      window.innerWidth <= 768
    ) {
      setIsSidebarOpen(false);
    }
  }

  function handleClearChat() {
    handleStopGenerating();

    setError("");
    setRetryRequest(null);
    setIsLoading(false);

    if (!activeChatId) {
      return;
    }

    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [],
            }
          : chat
      )
    );
  }

  function handleSelectChat(chatId) {
    handleStopGenerating();

    setActiveChatId(chatId);
    setError("");
    setRetryRequest(null);

    if (
      window.innerWidth <= 768
    ) {
      setIsSidebarOpen(false);
    }
  }

  function handleDeleteChat(chatId) {
    handleStopGenerating();

    setError("");
    setRetryRequest(null);
    setIsLoading(false);

    setChats((previousChats) => {
      const remainingChats =
        previousChats.filter(
          (chat) =>
            chat.id !== chatId
        );

      if (
        chatId === activeChatId
      ) {
        setActiveChatId(
          remainingChats[0]?.id ??
            null
        );
      }

      return remainingChats;
    });
  }

  function handleRenameChat(
    chatId,
    newTitle
  ) {
    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title: newTitle,
            }
          : chat
      )
    );
  }

  function handleToggleSidebar() {
    setIsSidebarOpen(
      (previousState) =>
        !previousState
    );
  }

  function handleCloseSidebar() {
    setIsSidebarOpen(false);
  }

  function handleToggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "light"
        ? "dark"
        : "light"
    );
  }

  // Persist conversations whenever they change.
  useEffect(() => {
    localStorage.setItem(
      "chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  // Persist the active conversation across reloads.
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

  // Apply and persist theme changes.
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem(
      "theme",
      theme
    );
  }, [theme]);

  return (
    <div className="app">
      <Header
        isSidebarOpen={
          isSidebarOpen
        }
        onToggleSidebar={
          handleToggleSidebar
        }
        theme={theme}
        onToggleTheme={
          handleToggleTheme
        }
      />

      <main className="app-layout">
        <Sidebar
          chats={chats}
          activeChatId={
            activeChatId
          }
          onSelectChat={
            handleSelectChat
          }
          onNewChat={
            handleNewChat
          }
          onClearChat={
            handleClearChat
          }
          onDeleteChat={
            handleDeleteChat
          }
          onRenameChat={
            handleRenameChat
          }
          isSidebarOpen={
            isSidebarOpen
          }
        />

        <button
          type="button"
          className={`sidebar-backdrop ${
            isSidebarOpen
              ? "sidebar-backdrop-visible"
              : ""
          }`}
          onClick={
            handleCloseSidebar
          }
          aria-label="Close sidebar"
          tabIndex={
            isSidebarOpen ? 0 : -1
          }
        />

        <ChatWindow
          messages={
            activeChat?.messages ??
            []
          }
          onAddMessage={
            handleAddMessage
          }
          onRegenerateResponse={
            handleRegenerateResponse
          }
          onEditMessage={
            handleEditMessage
          }
          onStopGenerating={
            handleStopGenerating
          }
          onRetry={
            retryRequest
              ? handleRetry
              : undefined
          }
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
}

export default App;