/**
 * Client-side code execution utility
 * Executes JavaScript natively and Python using Pyodide (WASM)
 */

let pyodideInstance = null;
let pyodideLoading = false;

/**
 * Load Pyodide (Python WASM runtime)
 */
async function loadPyodide() {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (pyodideLoading) {
    // Wait for the current loading to complete
    while (pyodideLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return pyodideInstance;
  }

  try {
    pyodideLoading = true;
    console.log("🐍 Loading Pyodide...");

    // Check if Pyodide script is already loaded
    if (!window.loadPyodide) {
      // Load Pyodide from CDN
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = (error) => {
          console.error("Failed to load Pyodide script:", error);
          reject(new Error("Failed to load Pyodide script from CDN"));
        };
        document.head.appendChild(script);
      });
    }

    // Wait a bit for the script to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!window.loadPyodide) {
      throw new Error("Pyodide loader not available after script load");
    }

    console.log("📦 Initializing Pyodide runtime...");
    pyodideInstance = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
    });

    console.log("✅ Pyodide loaded successfully");
    return pyodideInstance;
  } catch (error) {
    console.error("❌ Failed to load Pyodide:", error);
    pyodideLoading = false; // Reset on error
    throw new Error(`Failed to load Python runtime: ${error.message}`);
  } finally {
    if (pyodideInstance) {
      pyodideLoading = false;
    }
  }
}

/**
 * Execute JavaScript code in a sandboxed environment
 */
async function executeJavaScript(code, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let output = [];
    let hasError = false;

    // Create a timeout
    const timeout = setTimeout(() => {
      reject(new Error(`Execution timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      // Override console.log to capture output
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = (...args) => {
        output.push(
          args
            .map((arg) =>
              typeof arg === "object"
                ? JSON.stringify(arg, null, 2)
                : String(arg)
            )
            .join(" ")
        );
        originalLog.apply(console, args);
      };

      console.error = (...args) => {
        output.push("ERROR: " + args.map((arg) => String(arg)).join(" "));
        originalError.apply(console, args);
      };

      console.warn = (...args) => {
        output.push("WARNING: " + args.map((arg) => String(arg)).join(" "));
        originalWarn.apply(console, args);
      };

      // Execute the code
      // Use Function constructor for safer evaluation than eval
      const func = new Function(code);
      const result = func();

      // If the code returned a value, add it to output
      if (result !== undefined) {
        output.push(
          `Return value: ${
            typeof result === "object"
              ? JSON.stringify(result, null, 2)
              : result
          }`
        );
      }

      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;

      clearTimeout(timeout);

      const executionTime = Date.now() - startTime;
      resolve({
        success: true,
        output: output.length > 0 ? output.join("\n") : "(No output)",
        executionTime: `${executionTime}ms`,
      });
    } catch (error) {
      clearTimeout(timeout);

      const executionTime = Date.now() - startTime;
      resolve({
        success: false,
        output:
          output.join("\n") +
          (output.length > 0 ? "\n\n" : "") +
          `Error: ${error.message}`,
        error: error.message,
        executionTime: `${executionTime}ms`,
      });
    }
  });
}

/**
 * Execute Python code using Pyodide
 */
async function executePython(code, timeoutMs = 5000) {
  const startTime = Date.now();

  try {
    // Load Pyodide if not already loaded
    const pyodide = await loadPyodide();

    // Set up output capture in Python
    await pyodide.runPythonAsync(`
import sys
from io import StringIO

_stdout_buffer = StringIO()
_stderr_buffer = StringIO()
sys.stdout = _stdout_buffer
sys.stderr = _stderr_buffer
`);

    let executionError = null;
    let result = null;

    // Execute with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Execution timeout after ${timeoutMs}ms`)),
        timeoutMs
      );
    });

    try {
      const executionPromise = pyodide.runPythonAsync(code);
      result = await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      executionError = error;
    }

    // Get captured output
    const stdout = await pyodide.runPythonAsync("_stdout_buffer.getvalue()");
    const stderr = await pyodide.runPythonAsync("_stderr_buffer.getvalue()");

    // Reset stdout/stderr
    await pyodide.runPythonAsync(`
import sys
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

    const executionTime = Date.now() - startTime;

    if (executionError) {
      return {
        success: false,
        output: (stdout || "") + (stderr || "") + "\n\n" + String(executionError),
        error: String(executionError),
        executionTime: `${executionTime}ms`,
      };
    }

    const output = (stdout || "") + (stderr || "");
    return {
      success: true,
      output: output || "(No output)",
      executionTime: `${executionTime}ms`,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    console.error("Python execution error:", error);

    if (error.message && error.message.includes("timeout")) {
      return {
        success: false,
        output: "",
        error: error.message,
        executionTime: `${executionTime}ms`,
      };
    }

    return {
      success: false,
      output: "",
      error: error.message || String(error) || "Unknown error during execution",
      executionTime: `${executionTime}ms`,
    };
  }
}

/**
 * Execute code based on language
 */
export async function executeCode(code, language, timeoutMs = 5000) {
  if (!code || !code.trim()) {
    return {
      success: false,
      output: "",
      error: "No code to execute",
      executionTime: "0ms",
    };
  }

  console.log(`🚀 Executing ${language} code:`, code.substring(0, 50) + "...");

  try {
    if (language === "javascript") {
      return await executeJavaScript(code, timeoutMs);
    } else if (language === "python") {
      const result = await executePython(code, timeoutMs);
      console.log("🐍 Python execution result:", result);
      return result;
    } else {
      return {
        success: false,
        output: "",
        error: `Unsupported language: ${language}`,
        executionTime: "0ms",
      };
    }
  } catch (error) {
    console.error("❌ Execution error:", error);
    return {
      success: false,
      output: "",
      error: error.message || String(error) || "Execution failed",
      executionTime: "0ms",
    };
  }
}

/**
 * Check if Python runtime is ready
 */
export function isPythonReady() {
  return pyodideInstance !== null;
}

/**
 * Preload Python runtime
 */
export async function preloadPython() {
  try {
    await loadPyodide();
    return true;
  } catch (error) {
    console.error("Failed to preload Python:", error);
    return false;
  }
}
