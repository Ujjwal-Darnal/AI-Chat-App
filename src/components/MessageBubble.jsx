import "../styles/MessageBubble.css"
function MessageBubble({message}){
    return(
        <div className={`message ${message.role}`}>
            <p>{message.content}</p>
        </div>
    )
}
export default MessageBubble;