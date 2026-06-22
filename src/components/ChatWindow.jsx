import MessageList from "./MessageList";
import LoadingIndicator from "./LoadingIndicator";
import ChatInput from "./ChatInput";

function ChatWindow({messages}){
    return(
        <section className="chat-window">
            <MessageList messages = {messages}/>
            <LoadingIndicator/>
            <ChatInput/>
        </section>
    )
}
export default ChatWindow;