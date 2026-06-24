import MessageList from "./MessageList";
import LoadingIndicator from "./LoadingIndicator";
import ChatInput from "./ChatInput";

function ChatWindow({messages,onAddMessage,isLoading}){
    return(
        <section className="chat-window">
            <MessageList messages = {messages}/>
           {isLoading &&  <LoadingIndicator/>}
            <ChatInput onAddMessage = {onAddMessage}/>
        </section>
    )
}
export default ChatWindow;