import "../styles/Sidebar.css";
import {useState} from "react";

function Sidebar({
  onNewChat,
  onClearChat,
  onSelectChat,
  chats,
  activeChatId,
  onDeleteChat,
}
)

{
  const [openMenuId,setOpenMenuId] = useState(null);


// function for the menu
function handleToggleMenu(chatId){
  setOpenMenuId((currentId)=>
    currentId === chatId? null:chatId
  );
}

  return (
   <aside className="sidebar">
  <button
    type="button"
    className="new-chat-button"
    onClick={onNewChat}
  >
    <span>+</span>
    New chat
  </button>

  <div className="chat-list">
    {chats.map((chat) => (
      <div
        className={
          chat.id === activeChatId
            ? "chat-item-row active"
            : "chat-item-row"
        }
        key={chat.id}
      >
        <button
          type="button"
          className="chat-item"
          onClick={() => onSelectChat(chat.id)}
          title={chat.title}
        >
          {chat.title}
        </button>

       <div className="chat-menu">
  <button
    type="button"
    className="chat-menu-trigger"
    onClick={() => handleToggleMenu(chat.id)}
  >
    ⋮
  </button>

  {openMenuId === chat.id && (
    <div className="chat-menu-dropdown">
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