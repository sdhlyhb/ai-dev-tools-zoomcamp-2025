import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import Editor from "../components/Editor";
import { getSession } from "../api/session";
import { useWebSocket } from "../hooks/useWebSocket";
import { executeCode, preloadPython } from "../utils/codeExecutor";
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

  // Handle code updates from WebSocket
  const handleCodeUpdate = useCallback((data) => {
    if (data.code !== undefined) {
      setCode(data.code);
    }
    if (data.language !== undefined) {
      setLanguage(data.language);
      // If language is updated with clearOutput, also update the code with default comment
      if (data.clearOutput === true) {
        const newDefaultCode =
          data.language === "python"
            ? "# Start coding here...\n"
            : "// Start coding here...\n";
        setCode(newDefaultCode);
      }
    }
    if (data.executionResult !== undefined) {
      setOutput(data.executionResult);
    }
    if (data.clearOutput === true) {
      setOutput(null);
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
  const {
    isConnected,
    activeUsers,
    sendCodeUpdate,
    sendLanguageChange,
    sendExecutionResult,
  } = useWebSocket(
    sessionId,
    handleCodeUpdate,
    handleUserJoined,
    handleUserLeft
  );

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

          // Preload Python runtime if needed
          if (result.session.language === "python") {
            preloadPython().catch((err) =>
              console.warn("Failed to preload Python:", err)
            );
          }
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

      // Clear code and show only default comment for the new language
      const newDefaultCode =
        newLanguage === "python"
          ? "# Start coding here...\n"
          : "// Start coding here...\n";
      setCode(newDefaultCode);
      sendCodeUpdate(newDefaultCode);

      // Clear output section
      setOutput(null);

      // Preload Python runtime when switching to Python
      if (newLanguage === "python") {
        preloadPython().catch((err) =>
          console.warn("Failed to preload Python:", err)
        );
      }
    },
    [sendLanguageChange, sendCodeUpdate]
  );

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Run code execution (client-side using WASM)
  const handleRunCode = async () => {
    setIsRunning(true);

    // Show loading state in output
    const loadingOutput = {
      success: true,
      output:
        language === "python"
          ? "Loading Python runtime (first time may take a few seconds)...\n"
          : "Executing code...\n",
      executionTime: "...",
    };
    setOutput(loadingOutput);

    try {
      const result = await executeCode(code, language, 10000); // 10 second timeout

      setOutput(result);

      // Broadcast execution result to all connected users
      sendExecutionResult(result);

      if (result.success) {
        showToast("Code executed successfully!", "success");
      } else {
        showToast("Code execution failed", "error");
      }
    } catch (error) {
      console.error("Code execution failed:", error);
      const errorOutput = {
        success: false,
        output: error.message || "Unexpected error during execution",
        error: error.message,
        executionTime: "0ms",
      };
      setOutput(errorOutput);
      sendExecutionResult(errorOutput);
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
        <div className="editor-wrapper with-output">
          <Editor
            code={code}
            language={language}
            onChange={handleCodeChange}
            theme={theme}
          />
        </div>

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
          </div>
          <div className="output-panel-body">
            {output ? (
              <pre>{output.output}</pre>
            ) : (
              <div className="output-placeholder">
                <p>💡 Click "Run" to execute your code</p>
                <p className="output-hint">
                  Results will be shared with all collaborative users
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

export default EditorPage;
