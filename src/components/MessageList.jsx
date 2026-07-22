import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "../styles/ChatWindow.css";

function MessageList({
  messages,
  onRegenerateResponse,
  isLoading,
}) {
  const bottomRef = useRef(null);

  // Find the latest assistant message without mutating state
  const lastAssistantMessageId = [...messages]
    .reverse()
    .find(
      (message) => message.role === "assistant"
    )?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isLatestAssistant={
            message.id === lastAssistantMessageId
          }
          onRegenerateResponse={
            onRegenerateResponse
          }
          isLoading={isLoading}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;