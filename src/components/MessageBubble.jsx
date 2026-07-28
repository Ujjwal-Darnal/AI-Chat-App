import "../styles/MessageBubble.css";
import { useState } from "react";
import {
  Check,
  Copy,
  Pencil,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function MessageBubble({
  message,
  isLatestAssistant,
  isLatestUser,
  onRegenerateResponse,
  onEditMessage,
  isLoading,
}) {
  const [isCopied, setIsCopied] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [editedContent, setEditedContent] =
    useState(message.content);

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

  async function handleSaveEdit() {
    const trimmedContent =
      editedContent.trim();

    if (!trimmedContent) {
      return;
    }

    await onEditMessage(
      message.id,
      trimmedContent
    );

    setIsEditing(false);
  }

  function handleCancelEdit() {
    setEditedContent(message.content);
    setIsEditing(false);
  }

  return (
    <div
      className={`message ${message.role}`}
    >
      {isEditing ? (
        <div className="message-edit-form">
          <textarea
            className="message-edit-textarea"
            value={editedContent}
            onChange={(event) =>
              setEditedContent(
                event.target.value
              )
            }
            aria-label="Edit message"
            autoFocus
          />

          <div className="message-edit-actions">
            <button
              type="button"
              className="cancel-edit-button"
              onClick={handleCancelEdit}
              disabled={isLoading}
            >
              Cancel
            </button>

            <button
              type="button"
              className="save-edit-button"
              onClick={handleSaveEdit}
              disabled={
                !editedContent.trim() ||
                isLoading
              }
            >
              Save & Send
            </button>
          </div>
        </div>
      ) : (
        <div className="message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({
                className,
                children,
                ...props
              }) {
                const languageMatch =
                  /language-(\w+)/.exec(
                    className || ""
                  );

                if (languageMatch) {
                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={
                        languageMatch[1]
                      }
                      PreTag="div"
                    >
                      {String(
                        children
                      ).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                }

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
      )}

      {message.role === "assistant" &&
        isLatestAssistant &&
        !isEditing && (
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
              onClick={
                onRegenerateResponse
              }
              disabled={isLoading}
              aria-label="Regenerate response"
            >
              <RefreshCw size={16} />
              <span>Regenerate</span>
            </button>
          </div>
        )}

      {message.role === "user" &&
        isLatestUser &&
        !isEditing && (
          <div className="message-actions">
            <button
              type="button"
              className="edit-message-button"
              onClick={() =>
                setIsEditing(true)
              }
              aria-label="Edit user message"
              disabled={isLoading}
            >
              <Pencil size={16} />
              <span>Edit</span>
            </button>
          </div>
        )}
    </div>
  );
}

export default MessageBubble;