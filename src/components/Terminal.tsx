import { useEffect, useRef } from 'react';
import { useContainerStore } from '@/store/containerStore';
import { Terminal as TerminalIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Terminal() {
  const { terminalOutput, status } = useContainerStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalOutput]);

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
      </div>
    </div>
  );
}
