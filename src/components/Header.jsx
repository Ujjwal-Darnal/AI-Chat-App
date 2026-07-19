import "../styles/Header.css";
import {Menu} from "lucide-react";
function Header({isSidebarOpen,onToggleSidebar}){
    return (
        <header className="header">
            <button
            className="sidebar-toggle"
            type="button"
            onClick={onToggleSidebar}
            aria-label= {
                isSidebarOpen?"Close sidebar":"Open sidebar"
            }
            aria-expanded = {isSidebarOpen}
            >
                <Menu size = {22}/>
            </button>
            <span className="header-title">AI Chat App</span>
        </header>
    )
}
export default Header;