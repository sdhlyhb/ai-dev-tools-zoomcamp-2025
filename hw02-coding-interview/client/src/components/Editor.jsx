import { useCallback, useRef, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import "./Editor.css";

const LANGUAGE_EXTENSIONS = {
  javascript: javascript({ jsx: true }),
  python: python(),
};

function Editor({ code, language, onChange, theme }) {
  const editorRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounced onChange handler to reduce network traffic
  const handleChange = useCallback(
    (value) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        onChange(value);
      }, 300); // 300ms debounce
    },
    [onChange]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Get language extension
  const extensions = [
    LANGUAGE_EXTENSIONS[language] || LANGUAGE_EXTENSIONS.javascript,
  ];

  return (
    <div className="editor-container">
      <CodeMirror
        value={code}
        height="100%"
        extensions={extensions}
        onChange={handleChange}
        theme={theme === "dark" ? oneDark : "light"}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        style={{
          height: "100%",
          fontSize: "14px",
        }}
      />
    </div>
  );
}

export default Editor;
