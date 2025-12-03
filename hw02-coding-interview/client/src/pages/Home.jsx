import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createSession } from "../api/session";

function Home({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      const result = await createSession({
        language: "javascript",
        title: "New Session",
      });

      if (result.success) {
        navigate(`/session/${result.session.sessionId}`);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      alert("Failed to create session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinDemo = () => {
    navigate("/session/demo-session");
  };

  return (
    <div className="home-container">
      <div
        className="theme-toggle"
        style={{ position: "absolute", top: "20px", right: "20px" }}>
        <button onClick={toggleTheme} className="btn-secondary">
          {theme === "light" ? "🌙" : "☀️"}{" "}
          {theme === "light" ? "Dark" : "Light"} Mode
        </button>
      </div>

      <h1>CodePad</h1>
      <p>Collaborative Real-Time Code Editor</p>

      <div className="home-actions">
        <button
          onClick={handleCreateSession}
          className="btn-primary"
          disabled={loading}>
          {loading ? "Creating..." : "✨ Create New Session"}
        </button>
        <button onClick={handleJoinDemo} className="btn-secondary">
          👀 Try Demo
        </button>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Real-Time Sync</h3>
          <p>Code updates instantly across all connected users</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔗</div>
          <h3>Shareable Links</h3>
          <p>Share your session with a simple URL</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎨</div>
          <h3>Syntax Highlighting</h3>
          <p>Beautiful code highlighting for JavaScript and Python</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
