import { useCallback, useRef } from 'react';
import Editor, { type OnMount, type Monaco } from '@monaco-editor/react';
import { useContainerStore } from '@/store/containerStore';
import { FileCode2, X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Debounce utility
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function CodeEditor() {
  const { 
    container,
    activeFile, 
    openFiles, 
    updateFileContent, 
    setActiveFile,
    closeFile,
    markFileSaved,
    addTerminalOutput
  } = useContainerStore();
  
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  // Write file back to WebContainer (debounced)
  const writeToContainer = useCallback(
    debounce(async (path: string, content: string) => {
      if (!container) return;
      
      try {
        await container.fs.writeFile(path, content);
        markFileSaved(path);
        addTerminalOutput({
          type: 'info',
          text: `📝 Saved: ${path}\n`,
          timestamp: new Date(),
        });
      } catch (error) {
        addTerminalOutput({
          type: 'error',
          text: `❌ Failed to save ${path}: ${error}\n`,
          timestamp: new Date(),
        });
      }
    }, 500),
    [container, markFileSaved, addTerminalOutput]
  );

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    
    // 1. Update local state (UI)
    updateFileContent(activeFile.path, value);
    
    // 2. Write to WebContainer (triggers Vite HMR)
    writeToContainer(activeFile.path, value);
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor theme
    monaco.editor.defineTheme('codeforge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00D4FF' },
        { token: 'string', foreground: '9ECBFF' },
        { token: 'number', foreground: '79C0FF' },
        { token: 'type', foreground: '7EE787' },
      ],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#E6EDF3',
        'editor.lineHighlightBackground': '#161B22',
        'editor.selectionBackground': '#264F78',
        'editorLineNumber.foreground': '#484F58',
        'editorLineNumber.activeForeground': '#7D8590',
        'editorCursor.foreground': '#00D4FF',
        'editor.inactiveSelectionBackground': '#264F7880',
      },
    });
    monaco.editor.setTheme('codeforge-dark');
  };

  const handleTabClick = (file: typeof activeFile) => {
    if (file) setActiveFile(file);
  };

  const handleTabClose = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    closeFile(path);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tab Bar */}
      <div className="flex items-center bg-surface-elevated border-b border-border overflow-x-auto scrollbar-thin">
        {openFiles.length === 0 ? (
          <div className="px-4 py-2 text-sm text-muted-foreground">
            No files open
          </div>
        ) : (
          openFiles.map((file) => (
            <button
              key={file.path}
              onClick={() => handleTabClick(file)}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 text-sm border-r border-border transition-colors",
                "hover:bg-muted/50",
                activeFile?.path === file.path 
                  ? "bg-background text-foreground border-b-2 border-b-primary" 
                  : "text-muted-foreground"
              )}
            >
              <FileCode2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate max-w-32">{file.name}</span>
              {file.isDirty ? (
                <Circle className="w-2 h-2 fill-primary text-primary flex-shrink-0" />
              ) : (
                <X 
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:bg-muted rounded flex-shrink-0"
                  onClick={(e) => handleTabClose(e, file.path)}
                />
              )}
            </button>
          ))
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        {activeFile ? (
          <Editor
            height="100%"
            language={activeFile.language}
            value={activeFile.content}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
              fontLigatures: true,
              minimap: { enabled: true, scale: 1 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              padding: { top: 16 },
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              bracketPairColorization: { enabled: true },
              automaticLayout: true,
              wordWrap: 'on',
              tabSize: 2,
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading editor...</span>
                </div>
              </div>
            }
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
              <FileCode2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No File Selected
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Select a file from the explorer to start editing. Changes will automatically sync to the preview.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
