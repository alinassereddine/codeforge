import { useState } from 'react';
import { Zap, Play, RotateCcw, Settings, Sun, Moon, Laptop, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContainerStore } from '@/store/containerStore';
import { useThemeStore, type Theme } from '@/store/themeStore';
import {
  bootWebContainer,
  mountFiles,
  installDependencies,
  startDevServer,
} from '@/lib/webcontainer/container';
import { virtualFileSystem } from '@/lib/webcontainer/files';
import { cn } from '@/lib/utils';
import { downloadProjectAsZip } from '@/utils/downloadZip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const {
    status,
    setContainer,
    setStatus,
    setPreviewUrl,
    addTerminalOutput,
    clearTerminalOutput,
    setError,
    reset,
  } = useContainerStore();

  const { theme, setTheme } = useThemeStore();
  const { container } = useContainerStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const isLoading = ['booting', 'mounting', 'installing', 'starting'].includes(status);
  const isReady = status === 'ready';

  const handleBoot = async () => {
    try {
      clearTerminalOutput();
      setError(null);

      // Boot WebContainer
      setStatus('booting');
      addTerminalOutput({
        type: 'info',
        text: '🔄 Booting WebContainer...\n',
        timestamp: new Date(),
      });

      const container = await bootWebContainer();
      setContainer(container);

      addTerminalOutput({
        type: 'success',
        text: '✓ WebContainer booted successfully\n\n',
        timestamp: new Date(),
      });

      // Mount files
      setStatus('mounting');
      addTerminalOutput({
        type: 'info',
        text: '📁 Mounting virtual file system...\n',
        timestamp: new Date(),
      });

      await mountFiles(container, virtualFileSystem);

      addTerminalOutput({
        type: 'success',
        text: '✓ Files mounted\n\n',
        timestamp: new Date(),
      });

      // Install dependencies
      setStatus('installing');
      addTerminalOutput({
        type: 'info',
        text: '📦 Installing dependencies...\n\n',
        timestamp: new Date(),
      });

      const installSuccess = await installDependencies(container, addTerminalOutput);

      if (!installSuccess) {
        throw new Error('Failed to install dependencies');
      }

      addTerminalOutput({
        type: 'success',
        text: '\n✓ Dependencies installed\n\n',
        timestamp: new Date(),
      });

      // Start dev server
      setStatus('starting');
      addTerminalOutput({
        type: 'info',
        text: '🚀 Starting development server...\n\n',
        timestamp: new Date(),
      });

      await startDevServer(container, addTerminalOutput, (serverUrl) => {
        setPreviewUrl(serverUrl);
        setStatus('ready');
        addTerminalOutput({
          type: 'success',
          text: `\n✓ Server running at ${serverUrl}\n`,
          timestamp: new Date(),
        });
      });
    } catch (error) {
      console.error('Boot error:', error);
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Unknown error');
      addTerminalOutput({
        type: 'error',
        text: `\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
        timestamp: new Date(),
      });
    }
  };

  const handleReset = () => {
    reset();
    window.location.reload();
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'night-blue', label: 'Night Blue', icon: <Laptop className="w-4 h-4" /> },
  ];

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold gradient-text">CodeForge</h1>
          <p className="text-xs text-muted-foreground">Text-to-App Engine</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="hidden md:flex items-center gap-4">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
          status === 'idle' && "bg-muted/50 text-muted-foreground border-border",
          status === 'ready' && "bg-success/10 text-success border-success/30",
          status === 'error' && "bg-destructive/10 text-destructive border-destructive/30",
          isLoading && "bg-primary/10 text-primary border-primary/30 animate-pulse-glow"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            status === 'idle' && "bg-muted-foreground",
            status === 'ready' && "bg-success",
            status === 'error' && "bg-destructive",
            isLoading && "bg-primary animate-pulse"
          )} />
          <span className="capitalize">
            {status === 'ready' ? 'Running' : status}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!isReady && !isLoading && (
          <Button
            onClick={handleBoot}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
            disabled={isLoading}
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Boot Container</span>
          </Button>
        )}

        {isLoading && (
          <Button disabled className="gap-2" variant="secondary">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="hidden sm:inline capitalize">{status}...</span>
          </Button>
        )}

        {isReady && (
          <>
            {/* Download Button */}
            <Button
              onClick={async () => {
                setIsDownloading(true);
                await downloadProjectAsZip(container, 'codeforge-project.zip');
                setIsDownloading(false);
              }}
              variant="outline"
              className="gap-2"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isDownloading ? 'Exporting...' : 'Download'}</span>
            </Button>

            {/* Reset Button */}
            <Button
              onClick={handleReset}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </>
        )}

        {/* Settings Dropdown with Theme Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {themeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  theme === option.value && "bg-accent"
                )}
              >
                {option.icon}
                <span>{option.label}</span>
                {theme === option.value && (
                  <span className="ml-auto text-xs text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
