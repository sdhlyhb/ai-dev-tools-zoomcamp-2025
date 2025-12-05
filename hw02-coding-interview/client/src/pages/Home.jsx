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

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-content">
          <div className="home-logo">CodeSyncPad</div>
          <nav className="home-nav">
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#tech" className="nav-link">
              Technology
            </a>
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn-header"
              aria-label="Toggle theme">
              {theme === "light" ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
            </button>
          </nav>
        </div>
      </header>

      <div className="home-container">
        <div className="home-background">
          <div className="grid-overlay"></div>
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>

        <div className="home-content">
          <div className="hero-badge">Vibe Coding project by Serena Huang</div>
          <h1>CodeSyncPad</h1>
          <p>Real-time collaborative code editor with instant execution</p>

          <button
            onClick={handleCreateSession}
            className="btn-create-session"
            disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Creating session...
              </>
            ) : (
              <>
                Create new session
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>

          <div id="features" className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg
                  className="feature-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </div>
              <h3>Real-time Sync</h3>
              <p>
                Code updates instantly across all connected users with WebSocket
                technology
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg
                  className="feature-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <h3>Instant Execution</h3>
              <p>
                Run JavaScript and Python code directly in the browser using
                WebAssembly
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg
                  className="feature-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <h3>Share Anywhere</h3>
              <p>
                Generate shareable links instantly and collaborate with anyone,
                anywhere
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg
                  className="feature-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <h3>Syntax Highlighting</h3>
              <p>
                Beautiful code highlighting powered by CodeMirror with multiple
                themes
              </p>
            </div>
          </div>

          <div id="tech" className="tech-stack">
            <span className="tech-badge">React</span>
            <span className="tech-badge">WebSocket</span>
            <span className="tech-badge">WebAssembly</span>
            <span className="tech-badge">CodeMirror</span>
          </div>
        </div>
      </div>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">CodeSyncPad</div>
            <p className="footer-tagline">
              Real-time collaborative coding platform
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#tech">Technology</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer">
                GitHub
              </a>
              <a
                href="https://docs.example.com"
                target="_blank"
                rel="noopener noreferrer">
                Documentation
              </a>
            </div>
            <div className="footer-column">
              <h4>Connect</h4>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer">
                Twitter
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer">
                Discord
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 CodeSyncPad. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
