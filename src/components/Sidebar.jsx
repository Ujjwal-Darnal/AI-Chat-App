function Sidebar(onNewChat,onClearChat){
return(
 <aside className="sidebar">
   <button type="button"
   onClick={onNewChat}>+New Chat</button>

   <button type="button"
   onClick={onClearChat}>Clear Chat</button>
 </aside>
);
}
export default Sidebar;