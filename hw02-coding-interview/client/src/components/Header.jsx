import "./Header.css";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
];

function Header({
  sessionTitle,
  language,
  onLanguageChange,
  onRunCode,
  onCopyLink,
  theme,
  toggleTheme,
  isConnected,
  activeUsers,
}) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">💻</span>
          <span className="logo-text">CodePad</span>
        </div>
        <div className="session-info">
          <h2 className="session-title">{sessionTitle}</h2>
          <div className="connection-status">
            <span
              className={`status-indicator ${
                isConnected ? "connected" : "disconnected"
              }`}></span>
            <span className="status-text">
              {isConnected ? `${activeUsers} active` : "Connecting..."}
            </span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="language-selector">
          <label htmlFor="language-select" className="sr-only">
            Select Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="language-select">
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <button onClick={onRunCode} className="btn-run" title="Run code">
          ▶️ Run
        </button>

        <button
          onClick={onCopyLink}
          className="btn-copy"
          title="Copy share link">
          🔗 Copy Link
        </button>

        <button
          onClick={toggleTheme}
          className="btn-theme"
          title="Toggle theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>
    </header>
  );
}

export default Header;
