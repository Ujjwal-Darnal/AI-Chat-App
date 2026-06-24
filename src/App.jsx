import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import {useState} from "react";

const starterMessages = [
  {
    id: 1,
    role: "assistant",
    content: "Hi! I am your AI assistant. How can I help you today?",
  },
  {
    id: 2,
    role: "user",
    content: "Explain React props in simple words.",
  },
];

function App(){
  
  const [messages,setMessages] = useState(starterMessages);

  const[isLoading,setIsLoading] = useState(false);

  const[error,setError] = useState("");

  // ============ function to add message ===========//
  function handleAddMessage(newMessage){
    setError("");
    setMessages((prevMessages)=>[...prevMessages,newMessage]);
    setIsLoading(true);

   setTimeout(()=>{
     const aiMessage = {
      id:crypto.randomUUID(),
      role:"assistant",
      content:`i have recieved a message ${newMessage.content}`
    }
    setMessages((prevMessages)=>[
      ...prevMessages,aiMessage,
    ]);
    setIsLoading(false);
   },1000);
  
  }

  return(
 <div className="app">
  <Header/>

  <main className="app-layout">
    <Sidebar/>
    <ChatWindow  
    messages ={messages}
    onAddMessage = {handleAddMessage}
    isLoading={isLoading}
    error = {error}/>
  </main>
 </div>
  )
}
export default App;
