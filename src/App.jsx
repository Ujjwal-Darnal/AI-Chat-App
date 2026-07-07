import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import {useState,useEffect} from "react";
import "./styles/App.css"
import { getAIResponse } from "./services/aiService";


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
  
  const [messages,setMessages] = useState(()=>{
  const savedMessages = localStorage.getItem("messages");

  if(savedMessages){
    return JSON.parse(savedMessages);
  }
  return starterMessages}
   
  );

  const[isLoading,setIsLoading] = useState(false);

  const[error,setError] = useState("");

  // ============ function to add message ===========//
  async function handleAddMessage(newMessage){
    setError("");
    setMessages((prevMessages)=>[...prevMessages,newMessage]);
    setIsLoading(true);

    try{

      const reply = await getAIResponse(newMessage.content);
      const aiMessage = {
        id:crypto.randomUUID(),
        role:"assistant",
        content:reply,
      };
    
       setMessages((prevMessages)=>[...prevMessages,aiMessage]);
    }

    catch(error){
      console.error(error)
      setError("Something went wrong")
    }
      
finally{

 
  setIsLoading(false);
}

  }

  // function to handle new chat
  function handleNewChat(){
    setError("");
    setIsLoading(false);

    setMessages([
      {
        id:crypto.randomUUID(),
        role:"assistant",
        content:"Hi,I am your AI assistant. How can I help you today",
      }
    ])
  }

  // function to clear the chat
  function handleClearChat(){
    setError("");
    setIsLoading(false);
    setMessages([]);
  }


  // for the local Storage
  useEffect (()=>{
localStorage.setItem("messages",JSON.stringify(messages));
 
  },[messages]);

  return(
 <div className="app">
  <Header/>

  <main className="app-layout">
    <Sidebar
     onNewChat = {handleNewChat}
     onClearChat = {handleClearChat}/>
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
