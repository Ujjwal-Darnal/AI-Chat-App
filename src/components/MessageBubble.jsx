import "../styles/MessageBubble.css"
import {useState} from "react"
import { Copy, Check } from "lucide-react";
function MessageBubble({message}){

    const [isCopied,setIsCopied] = useState(false);

    async function handleCopyMessage(){
        try{
            await navigator.clipboard.writeText(message.content);

            setIsCopied(true);

            setTimeout(()=>{
                setIsCopied(false);
            },1500)
        }catch(error){
            console.error("Failed to copy message:",error);
        }
    }
return (
  <div className={`message ${message.role}`}>
    <p>{message.content}</p>

    {message.role === "assistant" && (
    <div className="message-actions">
  <button
    type="button"
    className="copy-message-button"
    onClick={handleCopyMessage}
  >
    {isCopied ? (
      <>
        <Check size={16} />
        <span>Copied</span>
      </>
    ) : (
      <>
        <Copy size={16} />
        <span>Copy</span>
      </>
    )}
  </button>
</div>
    )}
  </div>
);

}
export default MessageBubble;