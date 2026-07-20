import {useState,useRef} from "react";
import "../styles/ChatInput.css"
function ChatInput({onAddMessage,isLoading}){

    const[input,setInput] =useState("");
    const textareaRef = useRef(null);

    function handleInputChange(e){
        setInput(e.target.value)
        const textarea = e.target;

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
 function handleKeyDown(e){
    if(e.key === "Enter" && !e.shiftKey){
        e.preventDefault();

        if(!input.trim()|| isLoading){
            return;
        }
        handleSubmit(e);
    }
 }

    function handleSubmit(e){
        e.preventDefault();

        if(!input.trim()|| isLoading)return;

        const newMessage ={          id:crypto.randomUUID(),
            role:"user",
            content:input.trim(),

        };
        onAddMessage(newMessage);
        setInput("");

        requestAnimationFrame(()=>{
            if(textareaRef.current){
                textareaRef.current.style.height = "auto";
            }
        })
    }
    return(
        <form className="chat-input" onSubmit={handleSubmit} >

            <textarea
           ref={textareaRef}
            value = {input}
            placeholder="Ask anything..."
            onChange = {handleInputChange}
            rows={1}
            aria-label="Message" />

            <button 
            type="submit"
            disabled = {isLoading || !input.trim()}
            >{isLoading? "Thinking...":"Send"}</button>
        </form>
    )
}
export default ChatInput;