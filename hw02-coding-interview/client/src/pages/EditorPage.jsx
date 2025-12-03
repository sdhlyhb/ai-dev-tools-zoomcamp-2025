import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import Editor from "../components/Editor";
import { getSession } from "../api/session";
import { useWebSocket } from "../hooks/useWebSocket";
import "./EditorPage.css";

function EditorPage({ theme, toggleTheme }) {
  const { sessionId } = useParams();
  const [code, setCode] = useState("// Loading...\n");
  const [language, setLanguage] = useState("javascript");
  const [sessionTitle, setSessionTitle] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  // Handle code updates from WebSocket
  const handleCodeUpdate = useCallback((data) => {
    if (data.code !== undefined) {
      setCode(data.code);
    }
    if (data.language !== undefined) {
      setLanguage(data.language);
    }
  }, []);

  // Handle user joined
  const handleUserJoined = useCallback((data) => {
    showToast(`User joined (${data.activeUsers} active)`, "success");
  }, []);

  // Handle user left
  const handleUserLeft = useCallback((data) => {
    showToast(`User left (${data.activeUsers} active)`, "info");
  }, []);

  // Initialize WebSocket connection
  const { isConnected, activeUsers, sendCodeUpdate, sendLanguageChange } =
    useWebSocket(sessionId, handleCodeUpdate, handleUserJoined, handleUserLeft);

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      try {
        const result = await getSession(sessionId);

        if (result.success) {
          setCode(result.session.code);
          setLanguage(result.session.language);
          setSessionTitle(result.session.title);
        } else {
          showToast("Session not found", "error");
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        showToast("Failed to load session", "error");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  // Handle code changes from editor
  const handleCodeChange = useCallback(
    (newCode) => {
      setCode(newCode);
      sendCodeUpdate(newCode);
    },
    [sendCodeUpdate]
  );

  // Handle language change
  const handleLanguageChange = useCallback(
    (newLanguage) => {
      setLanguage(newLanguage);
      sendLanguageChange(newLanguage);
    },
    [sendLanguageChange]
  );

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Run code execution
  const handleRunCode = async () => {
    setIsRunning(true);
    showToast("Running code...", "info");

    try {
      // Mock code execution - in production, this would call a backend API
      // Simulate execution delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate output based on language
      let mockOutput;
      if (language === "javascript") {
        mockOutput = {
          success: true,
          output: "Code executed successfully!\nOutput would appear here...",
          executionTime: "124ms",
        };
      } else if (language === "python") {
        mockOutput = {
          success: true,
          output: "Code executed successfully!\nOutput would appear here...",
          executionTime: "156ms",
        };
      }

      setOutput(mockOutput);
      setShowOutput(true);
      showToast("Code executed successfully!", "success");
    } catch (error) {
      console.error("Code execution failed:", error);
      setOutput({
        success: false,
        output: "Error: Code execution failed\n" + error.message,
        executionTime: "0ms",
      });
      setShowOutput(true);
      showToast("Code execution failed", "error");
    } finally {
      setIsRunning(false);
    }
  };

  // Copy share link
  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        showToast("Link copied to clipboard!", "success");
      })
      .catch(() => {
        showToast("Failed to copy link", "error");
      });
  };

  // Toggle output panel
  const toggleOutput = () => {
    setShowOutput(!showOutput);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="editor-page">
      <Header
        sessionTitle={sessionTitle}
        language={language}
        onLanguageChange={handleLanguageChange}
        onRunCode={handleRunCode}
        onCopyLink={handleCopyLink}
        theme={theme}
        toggleTheme={toggleTheme}
        isConnected={isConnected}
        activeUsers={activeUsers}
      />

      <div className="editor-content">
        <div className={`editor-wrapper ${showOutput ? "with-output" : ""}`}>
          <Editor
            code={code}
            language={language}
            onChange={handleCodeChange}
            theme={theme}
          />
        </div>

        {showOutput && (
          <div className="output-panel">
            <div className="output-panel-header">
              <div className="output-header-left">
                <h3>Output</h3>
                {output && (
                  <div className="output-meta">
                    <span className="execution-time">
                      ⚡ {output.executionTime}
                    </span>
                    <span
                      className={`status-badge ${
                        output.success ? "success" : "error"
                      }`}>
                      {output.success ? "✓ Success" : "✗ Error"}
                    </span>
                  </div>
                )}
              </div>
              <button
                className="close-btn"
                onClick={toggleOutput}
                title="Close output panel">
                ✕
              </button>
            </div>
            <div className="output-panel-body">
              {output ? (
                <pre>{output.output}</pre>
              ) : (
                <div className="output-placeholder">
                  <p>Click "Run" to execute your code</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

export default EditorPage;
