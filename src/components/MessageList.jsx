function MessageList({messages}){
    return(
        messages.map(message=>(
            <MessageBubble 
            key = {message.id}
            message = {message}
            />
        ))
    )
}
export default MessageList