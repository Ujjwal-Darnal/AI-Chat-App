import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { useEffect, useRef, useState } from "react";
import "./styles/App.css";
import { getAIResponse } from "./services/aiService";

function App() {
  const [chats, setChats] = useState(() => {
    const savedChats = localStorage.getItem("chats");

    if (savedChats) {
      return JSON.parse(savedChats);
    }

    return [];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedActiveChatId =
      localStorage.getItem("activeChatId");

    const activeChatStillExists = chats.some(
      (chat) => chat.id === savedActiveChatId
    );

    if (activeChatStillExists) {
      return savedActiveChatId;
    }

    return chats[0]?.id ?? null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Store the controller for the currently active AI request
  const abortControllerRef = useRef(null);

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  const messages = activeChat?.messages ?? [];

  // Add the user's message and stream the AI response
  async function handleAddMessage(newMessage) {
    setError("");
    setIsLoading(true);

    // Create a controller so the request can be stopped
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const newTitle =
      newMessage.content.length > 30
        ? `${newMessage.content.slice(0, 30)}...`
        : newMessage.content;

    let targetChatId = activeChatId;
    let conversationMessages = [];

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
      const targetChat = chats.find(
        (chat) => chat.id === targetChatId
      );

      conversationMessages = [
        ...(targetChat?.messages ?? []),
        newMessage,
      ];

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id !== targetChatId) {
            return chat;
          }

          const hasUserMessage = chat.messages.some(
            (message) => message.role === "user"
          );

          return {
            ...chat,
            title: hasUserMessage
              ? chat.title
              : newTitle,
            messages: conversationMessages,
          };
        })
      );
    }

    // Create one empty assistant message before streaming starts
    const assistantMessageId = crypto.randomUUID();

    const emptyAssistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

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
      const apiMessages = conversationMessages.map(
        (message) => ({
          role: message.role,
          content: message.content,
        })
      );

      await getAIResponse(
        apiMessages,
        (chunk) => {
          // Append each streamed chunk to the same assistant message
          setChats((prevChats) =>
            prevChats.map((chat) => {
              if (chat.id !== targetChatId) {
                return chat;
              }

              return {
                ...chat,
                messages: chat.messages.map((message) =>
                  message.id === assistantMessageId
                    ? {
                        ...message,
                        content:
                          message.content + chunk,
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
      // Stopping the request is intentional, so do not show an error
      if (error.name === "AbortError") {
        return;
      }

      console.error(error);

      // Remove the assistant message when a real request error occurs
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === targetChatId
            ? {
                ...chat,
                messages: chat.messages.filter(
                  (message) =>
                    message.id !== assistantMessageId
                ),
              }
            : chat
        )
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
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

  // Open a blank chat without saving it
  function handleNewChat() {
    handleStopGenerating();

    setError("");
    setIsLoading(false);
    setActiveChatId(null);

    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }

  // Clear the currently active chat
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

  // Select a chat
  function handleSelectChat(chatId) {
    handleStopGenerating();

    setActiveChatId(chatId);
    setError("");

    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }

  // Delete a chat
  function handleDeleteChat(chatId) {
    handleStopGenerating();

    setError("");
    setIsLoading(false);

    setChats((prevChats) => {
      const remainingChats = prevChats.filter(
        (chat) => chat.id !== chatId
      );

      if (chatId === activeChatId) {
        setActiveChatId(
          remainingChats[0]?.id ?? null
        );
      }

      return remainingChats;
    });
  }

  // Rename a chat
  function handleRenameChat(chatId, newTitle) {
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

  // Save chats whenever chats change
  useEffect(() => {
    localStorage.setItem(
      "chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  // Save the currently active chat
  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem(
        "activeChatId",
        activeChatId
      );
    } else {
      localStorage.removeItem("activeChatId");
    }
  }, [activeChatId]);

  function handleToggleSidebar() {
    setIsSidebarOpen(
      (previousState) => !previousState
    );
  }

  function handleCloseSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="app">
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
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
          tabIndex={isSidebarOpen ? 0 : -1}
        />

        <ChatWindow
          messages={messages}
          onAddMessage={handleAddMessage}
          onStopGenerating={handleStopGenerating}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
}

export default App;