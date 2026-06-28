import MessageList from "./MessageList";
import LoadingIndicator from "./LoadingIndicator";
import ChatInput from "./ChatInput";
import { useEffect, useRef } from "react";
import "../styles/ChatWindow.css"
function ChatWindow({ messages, onAddMessage, isLoading, error }) {

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);


    return (
        <section className="chat-window">
            <MessageList messages={messages} />
            {isLoading && <LoadingIndicator />}

            {error && <p className="error-message">{error}</p>}

            <div ref={bottomRef}></div>

            <ChatInput onAddMessage={onAddMessage} />

        </section>
    )
}
export default ChatWindow;