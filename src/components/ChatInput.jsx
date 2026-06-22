function ChatInput(){
    return(
        <form className="chat-input">
            <input 
            type="text"
            placeholder="Ask anything..." />
            <button 
            type="submit"
            >Send</button>
        </form>
    )
}
export default ChatInput;