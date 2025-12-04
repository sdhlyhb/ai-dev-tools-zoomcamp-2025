# Client-Side Code Execution with WebAssembly

## Overview

This implementation provides **secure, client-side code execution** using WebAssembly instead of server-side execution, eliminating security risks.

## How It Works

### JavaScript Execution

- Runs directly in the browser using native JavaScript engine
- Uses `Function` constructor (safer than `eval`)
- Captures `console.log`, `console.error`, and `console.warn` output
- 10-second execution timeout to prevent infinite loops

### Python Execution

- Uses **Pyodide** - Python compiled to WebAssembly
- Runs entirely in the browser (no server required)
- Full Python 3.11 support with standard library
- First run downloads ~6MB WASM runtime (cached afterward)
- Captures stdout and stderr
- 10-second execution timeout

## Features

✅ **Security**

- All code runs in browser sandbox
- No server-side execution risk
- Cannot access local file system
- Cannot make arbitrary network requests

✅ **Performance**

- JavaScript: Instant execution
- Python: First load ~3-5 seconds, then fast
- Pyodide runtime cached after first load

✅ **Output Capture**

- Captures all console output
- Shows errors with full traceback
- Displays execution time
- Handles timeouts gracefully

## Usage

### JavaScript Example

```javascript
// Simple output
console.log("Hello, World!");

// Calculations
const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

for (let i = 0; i < 10; i++) {
  console.log(`fib(${i}) = ${fibonacci(i)}`);
}
```

### Python Example

```python
# Simple output
print("Hello, World!")

# Calculations
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")
```

## Technical Details

### Code Executor (`src/utils/codeExecutor.js`)

**Main Functions:**

- `executeCode(code, language, timeout)` - Main execution entry point
- `executeJavaScript(code, timeout)` - JavaScript execution
- `executePython(code, timeout)` - Python/Pyodide execution
- `preloadPython()` - Preload Python runtime
- `isPythonReady()` - Check if Python is loaded

**Return Format:**

```javascript
{
  success: true/false,
  output: "captured output text",
  error: "error message if failed",
  executionTime: "123ms"
}
```

### Integration

The executor is integrated into `EditorPage.jsx`:

1. Imports `executeCode` and `preloadPython`
2. Preloads Python when session language is Python
3. Preloads Python when user switches to Python
4. Executes code on "Run" button click
5. Displays output in side panel

### Loading Strategy

**Lazy Loading:**

- Pyodide loads only when needed (first Python execution or language switch)
- Script tag injected dynamically from CDN
- Prevents slowing down initial page load

**Caching:**

- Browser caches Pyodide WASM files
- Subsequent page loads use cached version
- Only first visit downloads ~6MB

## Security Benefits

### Why Client-Side Execution?

**Server Risks (Avoided):**

- ❌ Code injection attacks
- ❌ Resource exhaustion (CPU/memory)
- ❌ File system access
- ❌ Network attacks from server
- ❌ Breaking out of sandbox

**Client Benefits:**

- ✅ Code runs in browser sandbox
- ✅ No server CPU/memory usage
- ✅ Each user isolated
- ✅ Browser security model protection
- ✅ No privilege escalation possible

## Limitations

### Current Limitations

- Python execution requires internet (CDN) on first load
- Large Python programs may be slower than native
- Some Python packages not available in Pyodide
- 10-second timeout for both languages

### Supported Python Packages

Pyodide includes many popular packages:

- `numpy`, `pandas`, `scipy`
- `matplotlib` (with some limitations)
- `scikit-learn`
- Pure Python packages via `micropip`

### Not Supported

- C-extension packages not compiled to WASM
- File I/O operations
- Network requests (unless CORS-enabled)
- Threading (WebAssembly limitation)

## Performance Benchmarks

### JavaScript

- Simple programs: <10ms
- Complex calculations: 10-100ms
- No loading time

### Python (Pyodide)

- **First load**: 3-5 seconds (one-time)
- **Subsequent runs**: 50-200ms
- **Simple programs**: Similar to JavaScript after loaded
- **NumPy operations**: Near-native speed

## Future Enhancements

Possible improvements:

1. Add more languages (Ruby, Go via WASM)
2. Package management UI for Python
3. Syntax error detection before execution
4. Step-through debugging
5. Resource usage monitoring
6. Save execution history
7. Export output as file

## Testing

### Test JavaScript

```javascript
console.log("Testing JavaScript execution");
const arr = [1, 2, 3, 4, 5];
console.log(
  "Sum:",
  arr.reduce((a, b) => a + b, 0)
);
```

### Test Python

```python
print("Testing Python execution")
numbers = [1, 2, 3, 4, 5]
print("Sum:", sum(numbers))
```

### Test Error Handling

```javascript
// JavaScript error
throw new Error("This is a test error");
```

```python
# Python error
raise ValueError("This is a test error")
```

### Test Timeout

```javascript
// Infinite loop (will timeout after 10s)
while (true) {
  // This will be stopped by timeout
}
```

## CDN and Dependencies

**Pyodide CDN:**

- Version: 0.24.1
- CDN: `cdn.jsdelivr.net`
- Size: ~6MB (WASM + JS)
- License: Mozilla Public License 2.0

**No npm dependencies required** - Pyodide loads dynamically from CDN.

## Troubleshooting

### "Failed to load Python runtime"

- Check internet connection
- CDN might be blocked by firewall
- Try refreshing the page

### "Execution timeout"

- Code takes longer than 10 seconds
- Might have infinite loop
- Reduce computation complexity

### Python package not found

- Not all packages available in Pyodide
- Check Pyodide documentation for package list
- Use `micropip` for pure Python packages

## References

- [Pyodide Documentation](https://pyodide.org/)
- [WebAssembly](https://webassembly.org/)
- [MDN: Function Constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)
