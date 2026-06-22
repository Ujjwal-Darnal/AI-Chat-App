import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

function App(){
  return(
 <div className="app">
  <Header/>

  <main className="app-layout">
    <Sidebar/>
    <ChatWindow/>
  </main>
 </div>
  )
}
export default App
