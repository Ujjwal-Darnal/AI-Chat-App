import "../styles/Sidebar.css";

function Sidebar({
  onNewChat,
  onClearChat,
  onSelectChat,
  chats,
  activeChatId,
  onDeleteChat,
}) {
  return (
    <aside className="sidebar">

      {/* New Chat Button */}
      <button type="button" onClick={onNewChat}>
        + New Chat
      </button>

      {/* Chat List */}
      <div className="chat-list">
        {chats.map((chat) => (
          <div className="chat-item-row" key={chat.id}>

            <button
              type="button"
              onClick={() => onSelectChat(chat.id)}
              className={
                chat.id === activeChatId
                  ? "chat-item active"
                  : "chat-item"
              }
            >
              {chat.title}
            </button>

            <button
              type="button"
              className="delete-chat-button"
              onClick={() => onDeleteChat(chat.id)}
              aria-label={`Delete ${chat.title}`}
            >
              ×
            </button>

          </div>
        ))}
      </div>

      {/* Clear Chat Button */}
      <button type="button" onClick={onClearChat}>
        Clear Chat
      </button>

    </aside>
  );
}

export default Sidebar;