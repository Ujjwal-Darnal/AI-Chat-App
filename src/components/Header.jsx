import "../styles/Header.css";
import {
  Menu,
  Moon,
  Sun,
} from "lucide-react";

function Header({
  isSidebarOpen,
  onToggleSidebar,
  theme,
  onToggleTheme,
}) {
  const isDarkMode =
    theme === "dark";

  return (
    <header className="header">
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label={
          isSidebarOpen
            ? "Close sidebar"
            : "Open sidebar"
        }
        aria-expanded={
          isSidebarOpen
        }
      >
        <Menu size={20} />
      </button>

      <h1 className="header-title">
        AI Chat App
      </h1>

      <div className="header-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={
            isDarkMode
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            isDarkMode
              ? "Light mode"
              : "Dark mode"
          }
        >
          {isDarkMode ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}
        </button>
      </div>
    </header>
  );
}

export default Header;