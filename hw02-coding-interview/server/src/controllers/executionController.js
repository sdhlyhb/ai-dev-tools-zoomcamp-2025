import { config } from "../config/index.js";

/**
 * Execution Controller
 * Handles code execution in sandboxed environment
 */

export const executionController = {
  /**
   * Execute code
   * POST /api/execute
   */
  executeCode: async (req, res) => {
    try {
      const { code, language, sessionId } = req.body;

      // Validate required fields
      if (!code || !language) {
        return res.status(400).json({
          success: false,
          error: "Code and language are required",
          code: "INVALID_REQUEST",
        });
      }

      // Validate language
      if (!["javascript", "python"].includes(language)) {
        return res.status(400).json({
          success: false,
          error: "Invalid language specified",
          code: "INVALID_LANGUAGE",
        });
      }

      // Mock code execution
      // In production, this would use Docker containers or VM2 for sandboxing
      const startTime = Date.now();

      try {
        const output = await executeCodeSafely(
          code,
          language,
          config.execution.timeoutMs
        );
        const executionTime = `${Date.now() - startTime}ms`;

        res.json({
          success: true,
          output,
          executionTime,
        });
      } catch (error) {
        const executionTime = `${Date.now() - startTime}ms`;

        if (error.message === "TIMEOUT") {
          return res.status(408).json({
            success: false,
            error: `Execution timeout after ${
              config.execution.timeoutMs / 1000
            } seconds`,
            executionTime,
          });
        }

        res.json({
          success: false,
          output: "",
          error: error.message,
          executionTime,
        });
      }
    } catch (error) {
      console.error("Error executing code:", error);
      res.status(500).json({
        success: false,
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      });
    }
  },
};

/**
 * Mock code execution function
 * In production, this would execute code in a sandboxed environment
 * using Docker containers, VM2, or a dedicated code execution service
 */
async function executeCodeSafely(code, language, timeoutMs) {
  return new Promise((resolve, reject) => {
    // Set timeout
    const timeout = setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, timeoutMs);

    try {
      // Mock execution - simulate different outputs
      let output = "";

      if (language === "javascript") {
        // Simulate JavaScript execution
        output = mockJavaScriptExecution(code);
      } else if (language === "python") {
        // Simulate Python execution
        output = mockPythonExecution(code);
      }

      clearTimeout(timeout);
      resolve(output);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

/**
 * Mock JavaScript execution
 */
function mockJavaScriptExecution(code) {
  // Simple pattern matching for common outputs
  if (code.includes("console.log") && code.includes("Hello")) {
    return "Hello, World!\n";
  }

  if (code.includes("fibonacci")) {
    return `Fibonacci sequence:
fib(0) = 0
fib(1) = 1
fib(2) = 1
fib(3) = 2
fib(4) = 3
fib(5) = 5
fib(6) = 8
fib(7) = 13
fib(8) = 21
fib(9) = 34
`;
  }

  if (code.includes("SyntaxError") || code.includes("error")) {
    throw new Error("SyntaxError: Unexpected token");
  }

  return "Code executed successfully!\nOutput would appear here...\n";
}

/**
 * Mock Python execution
 */
function mockPythonExecution(code) {
  // Simple pattern matching for common outputs
  if (code.includes("print") && code.includes("Hello")) {
    return "Hello, World!\n";
  }

  if (code.includes("range") && code.includes("for")) {
    return "0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n";
  }

  if (code.includes("SyntaxError") || code.includes("error")) {
    throw new Error("SyntaxError: invalid syntax");
  }

  return "Code executed successfully!\nOutput would appear here...\n";
}
