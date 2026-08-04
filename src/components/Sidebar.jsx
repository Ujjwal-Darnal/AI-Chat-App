import "../styles/Sidebar.css";
import {
  useEffect,
  useRef,
  useState,
} from "react";

function Sidebar({
  onNewChat,
  onClearChat,
  onSelectChat,
  chats,
  activeChatId,
  onDeleteChat,
  onRenameChat,
  isSidebarOpen,
}) {
  const [openMenuId, setOpenMenuId] =
    useState(null);

  const [editingChatId, setEditingChatId] =
    useState(null);

  const [editedTitle, setEditedTitle] =
    useState("");

  const sidebarRef = useRef(null);

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
    const trimmedTitle =
      editedTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    onRenameChat(
      chatId,
      trimmedTitle
    );

    setEditingChatId(null);
    setEditedTitle("");
  }

  function handleCancelRename() {
    setEditingChatId(null);
    setEditedTitle("");
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(
          event.target
        )
      ) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${
        isSidebarOpen
          ? "sidebar-open"
          : "sidebar-closed"
      }`}
    >
      <button
        type="button"
        className="new-chat-button"
        onClick={onNewChat}
      >
        <span>+</span>
        New chat
      </button>

      <div className="chat-list">
        {chats.map((chat, index) => {
          const shouldOpenUp =
            chats.length > 4 &&
            index >= chats.length - 2;

          return (
            <div
              key={chat.id}
              className={
                chat.id === activeChatId
                  ? "chat-item-row active"
                  : "chat-item-row"
              }
            >
              {editingChatId ===
              chat.id ? (
                <input
                  type="text"
                  className="chat-rename-input"
                  value={editedTitle}
                  onChange={(event) =>
                    setEditedTitle(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleSaveRename(
                        chat.id
                      );
                    }

                    if (
                      event.key ===
                      "Escape"
                    ) {
                      handleCancelRename();
                    }
                  }}
                  onBlur={handleCancelRename}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className="chat-item"
                  onClick={() =>
                    onSelectChat(chat.id)
                  }
                  title={chat.title}
                >
                  {chat.title}
                </button>
              )}

              <div className="chat-menu">
                <button
                  type="button"
                  className="chat-menu-trigger"
                  onClick={() =>
                    handleToggleMenu(
                      chat.id
                    )
                  }
                  aria-label={`Open actions for ${chat.title}`}
                  aria-expanded={
                    openMenuId === chat.id
                  }
                >
                  ⋮
                </button>

                {openMenuId ===
                  chat.id && (
                  <div
                    className={`chat-menu-dropdown ${
                      shouldOpenUp
                        ? "open-up"
                        : "open-down"
                    }`}
                  >
                    <button
                      type="button"
                      className="chat-menu-action"
                      onClick={() =>
                        handleStartRename(
                          chat
                        )
                      }
                    >
                      Rename
                    </button>

                    <button
                      type="button"
                      className="chat-menu-action danger"
                      onClick={() => {
                        onDeleteChat(
                          chat.id
                        );

                        setOpenMenuId(
                          null
                        );
                      }}
                    >
                      Delete chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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