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

  // ============ function to add message ===========//
  function handleAddMessage(newMessage){
    setMessages((prevMessages)=>[...prevMessages,newMessage]);
  }

  return(
 <div className="app">
  <Header/>

  <main className="app-layout">
    <Sidebar/>
    <ChatWindow  
    messages ={messages}
    onAddMessage = {handleAddMessage}/>
  </main>
 </div>
  )
}
export default App
