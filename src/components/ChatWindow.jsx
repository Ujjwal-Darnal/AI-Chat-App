import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import LoadingIndicator from "./LoadingIndicator";
import "../styles/ChatWindow.css";

function ChatWindow({
  messages,
  onAddMessage,
  onStopGenerating,
  isLoading,
  error,
}) {
  const hasMessages = messages.length > 0;

  return (
    <section className="chat-window">
      <div className="chat-content">
        {hasMessages ? (
          <MessageList messages={messages} />
        ) : (
          <div className="chat-empty-state">
            <div className="empty-state-icon">AI</div>

            <h1>How can I help you today?</h1>

            <p>
              Ask a question, explore an idea, or get help with
              your code. Start by typing a message below.
            </p>

            <div className="example-prompts">
              <span>Explain a difficult concept</span>
              <span>Help debug my code</span>
              <span>Prepare for an interview</span>
            </div>
          </div>
        )}

        {isLoading && <LoadingIndicator />}

        {error && (
          <p className="chat-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <ChatInput
        onAddMessage={onAddMessage}
        onStopGenerating={onStopGenerating}
        isLoading={isLoading}
      />
    </section>
  );
}

export default ChatWindow;