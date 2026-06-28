import MessageBubble from "./MessageBubble"
import "../styles/ChatWindow.css"
function MessageList({messages}){
    return(
       <div className="message-list">
        {messages.map((message)=>(
            <MessageBubble
            key={message.id}
            message={message}/>
        ))}

       </div>
    )
}
export default MessageList;