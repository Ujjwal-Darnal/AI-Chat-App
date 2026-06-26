import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import {useState,useEffect} from "react";

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
