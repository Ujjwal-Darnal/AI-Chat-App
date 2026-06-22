function ChatWindow(){
    return(
<section className="chat-window">
    <MessageList/>
    <LoadingIndicator/>
    <ChatInput/>
</section>
  
    )
}
export default ChatWindow;