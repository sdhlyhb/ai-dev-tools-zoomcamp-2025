// Mock API calls - centralized backend communication
// When backend is ready, replace these with actual HTTP/WebSocket calls

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Generate a random session ID for mock purposes
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15);
};

// Mock data store (simulates backend)
const mockSessions = new Map();

/**
 * Create a new code session
 * @param {Object} data - Session data (language, code, title)
 * @returns {Promise<Object>} Created session
 */
export const createSession = async (data = {}) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const sessionId = generateSessionId();
  const session = {
    sessionId,
    language: data.language || "javascript",
    code: data.code || "// Start coding here...\n",
    title: data.title || "Untitled Session",
    createdAt: new Date().toISOString(),
    activeUsers: 0,
  };

  // Store in mock database
  mockSessions.set(sessionId, session);

  console.log("📝 Mock: Session created", session);

  return {
    success: true,
    session,
    shareableLink: `${window.location.origin}/session/${sessionId}`,
  };

  // Real implementation would be:
  // const response = await fetch(`${API_BASE_URL}/sessions`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
  // return response.json();
};

/**
 * Get session data by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Session data
 */
export const getSession = async (sessionId) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const session = mockSessions.get(sessionId);

  if (!session) {
    console.log("❌ Mock: Session not found", sessionId);
    return {
      success: false,
      error: "Session not found",
    };
  }

  console.log("✅ Mock: Session retrieved", session);

  return {
    success: true,
    session,
  };

  // Real implementation would be:
  // const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
  // return response.json();
};

/**
 * Update session data
 * @param {string} sessionId - Session ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated session
 */
export const updateSession = async (sessionId, updates) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const session = mockSessions.get(sessionId);

  if (!session) {
    return {
      success: false,
      error: "Session not found",
    };
  }

  const updatedSession = { ...session, ...updates };
  mockSessions.set(sessionId, updatedSession);

  console.log("🔄 Mock: Session updated", updatedSession);

  return {
    success: true,
    session: updatedSession,
  };

  // Real implementation would be:
  // const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(updates),
  // });
  // return response.json();
};

/**
 * Get list of supported languages
 * @returns {Promise<Array>} Array of languages
 */
export const getSupportedLanguages = async () => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const languages = [
    { value: "javascript", label: "JavaScript", extension: "js" },
    { value: "python", label: "Python", extension: "py" },
  ];

  console.log("📋 Mock: Languages retrieved", languages);

  return {
    success: true,
    languages,
  };

  // Real implementation would be:
  // const response = await fetch(`${API_BASE_URL}/languages`);
  // return response.json();
};

/**
 * Initialize a mock session for demo purposes
 */
export const initializeDemoSession = () => {
  const demoSessionId = "demo-session";
  const demoSession = {
    sessionId: demoSessionId,
    language: "javascript",
    code: `// Welcome to CodePad! 🚀
// This is a collaborative code editor
// Try changing the code and see it sync in real-time

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci sequence:');
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}
`,
    title: "Demo Session",
    createdAt: new Date().toISOString(),
    activeUsers: 1,
  };

  mockSessions.set(demoSessionId, demoSession);
  return demoSessionId;
};

// Initialize demo session on load
initializeDemoSession();
