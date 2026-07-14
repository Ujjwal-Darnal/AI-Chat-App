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

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  const messages = activeChat ? activeChat.messages : [];

  // Add the user's message and request an AI response
  async function handleAddMessage(newMessage) {
    setError("");
    setIsLoading(true);

    const newTitle =
      newMessage.content.length > 30
        ? `${newMessage.content.slice(0, 30)}...`
        : newMessage.content;

    let targetChatId = activeChatId;

    if (!targetChatId) {
      targetChatId = crypto.randomUUID();

      const newChat = {
        id: targetChatId,
        title: newTitle,
        messages: [newMessage],
      };

      setChats((prevChats) => [...prevChats, newChat]);
      setActiveChatId(targetChatId);
    } else {
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
            title: !hasUserMessage
              ? newTitle
              : chat.title,
            messages: [...chat.messages, newMessage],
          };
        })
      );
    }

    try {
      const reply = await getAIResponse(newMessage.content);

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
                messages: [...chat.messages, aiMessage],
              }
            : chat
        )
      );
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Open a blank chat without saving it
  function handleNewChat() {
    setError("");
    setIsLoading(false);
    setActiveChatId(null);
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

  // Save chats whenever the chats state changes
  useEffect(() => {
    localStorage.setItem(
      "chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  return (
    <div className="app">
      <Header />

      <main className="app-layout">
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onClearChat={handleClearChat}
          onDeleteChat={handleDeleteChat}
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