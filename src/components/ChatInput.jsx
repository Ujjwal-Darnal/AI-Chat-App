import {useState} from "react";
import "../styles/ChatInput.css"
function ChatInput({onAddMessage}){

    const[input,setInput] =useState("");

    function handleSubmit(e){
        e.preventDefault();

        if(!input.trim())return;

        const newMessage ={          id:crypto.randomUUID(),
            role:"user",
            content:input.trim(),

        };
        onAddMessage(newMessage);
        setInput("");
    }
    return(
        <form className="chat-input" onSubmit={handleSubmit} >

            <input 
            type="text"
            value = {input}
            placeholder="Ask anything..."
            onChange = {(e)=>setInput(e.target.value)} />

            <button 
            type="submit"
            >Send</button>
        </form>
    )
}
export default ChatInput;