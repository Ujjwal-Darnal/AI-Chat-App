import { useRef, useState } from "react";
import "../styles/ChatInput.css";

function ChatInput({
  onAddMessage,
  onStopGenerating,
  isLoading,
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  function handleInputChange(event) {
    setInput(event.target.value);

    const textarea = event.target;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function sendMessage() {
    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    const newMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedInput,
    };

    onAddMessage(newMessage);
    setInput("");

    // Reset the textarea height after sending
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        value={input}
        placeholder="Ask anything..."
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        rows={1}
        aria-label="Message"
        disabled={isLoading}
      />

      {isLoading ? (
        <button
          type="button"
          className="stop-button"
          onClick={onStopGenerating}
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          disabled={!input.trim()}
        >
          Send
        </button>
      )}
    </form>
  );
}

export default ChatInput;