import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { useEffect, useState } from "react";
import "./styles/App.css";
import { getAIResponse } from "./services/aiService";

function App() {
  const starterNewChat = [
    {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Hi, I am your AI assistant. How can I help you?",
        },
      ],
    },
  ];

  const [chats, setChats] = useState(() => {
    const savedChats = localStorage.getItem("chats");

    if (savedChats) {
      return JSON.parse(savedChats);
    }

    return starterNewChat;
  });

  const [activeChatId, setActiveChatId] = useState(chats[0]?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat ? activeChat.messages : [];

  // Add the user's message and request an AI response
  async function handleAddMessage(newMessage) {
    setError("");

    const newTitle = newMessage.content.length > 30 ?`${newMessage.content.slice(0,30)}...`:newMessage.content;

   setChats((prevChats) =>
  prevChats.map((chat) => {
    if (chat.id !== activeChatId) {
      return chat;
    }

    const hasUserMessage = chat.messages.some(
      (message) => message.role === "user"
    );

    return {
      ...chat,
      title: !hasUserMessage ? newTitle : chat.title,
      messages: [...chat.messages, newMessage],
    };
  })
);

    setIsLoading(true);

    try {
      const reply = await getAIResponse(newMessage.content);

      const aiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChatId
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

  // Create a new chat
  function handleNewChat() {
    setError("");
    setIsLoading(false);

    const newChat = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Hi, I am your AI assistant. How can I help you today?",
        },
      ],
    };

    setChats((prevChats) => [...prevChats, newChat]);
    setActiveChatId(newChat.id);
  }

  // Clear the currently active chat
  function handleClearChat() {
    setError("");
    setIsLoading(false);

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

  // function to hanldeSelectChat

  function handleSelectChat(chatId){
   setActiveChatId(chatId);
  }


  // Save chats whenever the chats state changes
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  return (
    <div className="app">
      <Header />

      <main className="app-layout">
        <Sidebar
          chats = {chats}
          activeChatId = {activeChatId}
          onSelectChat = {handleSelectChat}
          onNewChat={handleNewChat}
          onClearChat={handleClearChat}
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