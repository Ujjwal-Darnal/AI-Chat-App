import "../styles/Sidebar.css";
import { useState,useEffect,useRef } from "react";

function Sidebar({
  onNewChat,
  onClearChat,
  onSelectChat,
  chats,
  activeChatId,
  onDeleteChat,
  onRenameChat,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const menuRef = useRef(null);

  function handleToggleMenu(chatId) {
    setOpenMenuId((currentId) =>
      currentId === chatId ? null : chatId
    );
  }

  function handleStartRename(chat) {
    setEditingChatId(chat.id);
    setEditedTitle(chat.title);
    setOpenMenuId(null);
  }

  function handleSaveRename(chatId) {
    const trimmedTitle = editedTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    onRenameChat(chatId, trimmedTitle);
    setEditingChatId(null);
    setEditedTitle("");
  }

  function handleCancelRename() {
    setEditingChatId(null);
    setEditedTitle("");
  }

  useEffect(()=>{
    function handleClickOutside(event){
      if(
        menuRef.current && !menuRef.current.contains(event.target)
      ){
        setOpenMenuId(null);
      }
    }
     document.addEventListener("mousedown",handleClickOutside);

     return ()=>{
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
     };
  },[]);
 
  return (
    <aside className="sidebar" ref={menuRef}>
      <button
        type="button"
        className="new-chat-button"
        onClick={onNewChat}
      >
        <span>+</span>
        New chat
      </button>

      <div className="chat-list">
        {chats.map((chat, index) => (
          <div
            className={
              chat.id === activeChatId
                ? "chat-item-row active"
                : "chat-item-row"
            }
            key={chat.id}
          >
            {editingChatId === chat.id ? (
              <input
                type="text"
                className="chat-rename-input"
                value={editedTitle}
                onChange={(event) =>
                  setEditedTitle(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSaveRename(chat.id);
                  }

                  if (event.key === "Escape") {
                    handleCancelRename();
                  }
                }}
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="chat-item"
                onClick={() => onSelectChat(chat.id)}
                title={chat.title}
              >
                {chat.title}
              </button>
            )}

            <div className="chat-menu">
              <button
                type="button"
                className="chat-menu-trigger"
                onClick={() => handleToggleMenu(chat.id)}
                aria-label={`Open actions for ${chat.title}`}
                aria-expanded={openMenuId === chat.id}
              >
                ⋮
              </button>

              {openMenuId === chat.id && (
                <div
                  className={
                    index === 0
                      ? "chat-menu-dropdown open-down"
                      : "chat-menu-dropdown open-up"
                  }
                >
                  <button
                    type="button"
                    className="chat-menu-action"
                    onClick={() => handleStartRename(chat)}
                  >
                    Rename
                  </button>

                  <button
                    type="button"
                    className="chat-menu-action danger"
                    onClick={() => {
                      onDeleteChat(chat.id);
                      setOpenMenuId(null);
                    }}
                  >
                    Delete chat
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="clear-chat-button"
        onClick={onClearChat}
      >
        Clear current chat
      </button>
    </aside>
  );
}

export default Sidebar;