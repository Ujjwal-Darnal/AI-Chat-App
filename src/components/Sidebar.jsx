function Sidebar(onNewChat){
return(
 <aside className="sidebar">
   <button type="button"
   onClick={onNewChat}>+New Chat</button>
 </aside>
);
}
export default Sidebar;