import "../styles/MessageBubble.css";
import { useState } from "react";
import {
  Check,
  Copy,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function MessageBubble({
  message,
  isLatestAssistant,
  onRegenerateResponse,
  isLoading,
}) {
  const [isCopied, setIsCopied] = useState(false);

  // Copy the complete assistant message
  async function handleCopyMessage() {
    try {
      await navigator.clipboard.writeText(
        message.content
      );

      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Failed to copy message:",
        error
      );
    }
  }

  return (
    <div className={`message ${message.role}`}>
      <div className="message-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const languageMatch =
                /language-(\w+)/.exec(
                  className || ""
                );

              // Render fenced code blocks
              // using syntax highlighting
              if (languageMatch) {
                return (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={languageMatch[1]}
                    PreTag="div"
                  >
                    {String(children).replace(
                      /\n$/,
                      ""
                    )}
                  </SyntaxHighlighter>
                );
              }

              // Render normal inline code
              return (
                <code
                  className={className}
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      {/* Only show actions for the latest assistant response */}
      {message.role === "assistant" &&
        isLatestAssistant && (
          <div className="message-actions">
            <button
              type="button"
              className="copy-message-button"
              onClick={handleCopyMessage}
              aria-label={
                isCopied
                  ? "Message copied"
                  : "Copy assistant message"
              }
            >
              {isCopied ? (
                <>
                  <Check size={16} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="regenerate-message-button"
              onClick={onRegenerateResponse}
              disabled={isLoading}
              aria-label="Regenerate response"
            >
              <RefreshCw size={16} />
              <span>Regenerate</span>
            </button>
          </div>
        )}
    </div>
  );
}

export default MessageBubble;