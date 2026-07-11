import "../styles/Sidebar.css"
function Sidebar({onNewChat,onClearChat,
onSelectChat,
chats,
activeChatId,
}){
return(
 <aside className="sidebar">
   <button type="button"
   onClick={onNewChat}>+New Chat</button>

  <div className="chat-list">
    {chats.map((chat)=>(
      <button type="button"
      key={chat.id}
      onClick={()=>onSelectChat(chat.id)}
      className={
        chat.id===activeChatId?"chat-item active":"chat-item"
      }>
        {chat.title}
      </button>
))

    }
  </div>

   <button type="button"
   onClick={onClearChat}>Clear Chat</button>


 </aside>
);
}
export default Sidebar;