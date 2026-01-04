import { useState, useEffect, useRef } from 'react';
import { useContainerStore } from '@/store/containerStore';
import { executeShellCommand } from '@/lib/webcontainer/container';
import { Terminal as TerminalIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Terminal() {
  const { terminalOutput, status, container, addTerminalOutput } = useContainerStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !container) return;

    const command = input.trim();
    setHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    setInput('');

    // Focus back on input
    inputRef.current?.focus();

    await executeShellCommand(container, command, addTerminalOutput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    }
  };

  const getOutputColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-terminal-text';
      case 'error':
        return 'text-terminal-error';
      case 'info':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full bg-terminal-bg">

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm scrollbar-thin terminal-gradient"
      >
        {terminalOutput.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-primary">$</span>
            <span className="animate-blink">▋</span>
          </div>
        ) : (
          terminalOutput.map((output, index) => (
            <div
              key={index}
              className={cn('whitespace-pre-wrap break-all', getOutputColor(output.type))}
            >
              {output.text}
            </div>
          ))
        )}
        {status !== 'idle' && status !== 'ready' && status !== 'error' && (
          <div className="flex items-center gap-2 text-muted-foreground mt-2">
            <span className="text-primary">$</span>
            <span className="animate-blink">▋</span>
          </div>
        )}

        {/* Input Line */}
        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
            <span className="text-primary font-bold">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-terminal-text font-mono p-0 h-6 focus:ring-0"
              autoComplete="off"
              autoFocus
            />
          </form>
        )}
      </div>
    </div>
  );
}
