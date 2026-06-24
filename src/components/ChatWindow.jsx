import MessageList from "./MessageList";
import LoadingIndicator from "./LoadingIndicator";
import ChatInput from "./ChatInput";

function ChatWindow({messages,onAddMessage,isLoading,error}){
    return(
        <section className="chat-window">
            <MessageList messages = {messages}/>
           {isLoading &&  <LoadingIndicator/>}

           {error && <p className="error-message">{error}</p>}
           
            <ChatInput onAddMessage = {onAddMessage}/>
            
        </section>
    )
}
export default ChatWindow;