import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { useEffect, useState } from "react";
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

  const [activeChatId, setActiveChatId] = useState(
    chats[0]?.id ?? null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  const messages = activeChat?.messages ?? [];

  // Add the user's message and request an AI response
  async function handleAddMessage(newMessage) {
    setError("");
    setIsLoading(true);

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

    try {
      const apiMessages = conversationMessages.map(
        (message) => ({
          role: message.role,
          content: message.content,
        })
      );

      const reply = await getAIResponse(apiMessages);

      const aiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === targetChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  aiMessage,
                ],
              }
            : chat
        )
      );
    } catch (error) {
      console.error(error);
      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Open a blank chat without saving it
  function handleNewChat() {
    setError("");
    setIsLoading(false);
    setActiveChatId(null);

    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }

  // Clear the currently active chat
  function handleClearChat() {
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
    setActiveChatId(chatId);
    setError("");

    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }

  // Delete a chat
  function handleDeleteChat(chatId) {
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

  // Save chats whenever chats state changes
  useEffect(() => {
    localStorage.setItem(
      "chats",
      JSON.stringify(chats)
    );
  }, [chats]);

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
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
}

export default App;