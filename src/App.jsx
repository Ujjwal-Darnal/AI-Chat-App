import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

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
  return(
 <div className="app">
  <Header/>

  <main className="app-layout">
    <Sidebar/>
    <ChatWindow />
  </main>
 </div>
  )
}
export default App
