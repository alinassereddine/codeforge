import { useContainerStore } from '@/store/containerStore';
import { Monitor, RefreshCw, ExternalLink, Loader2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function PreviewPane() {
  const { previewUrl, status } = useContainerStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleRefresh = () => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-surface-sunken",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Preview</span>
          {status === 'ready' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {previewUrl && (
            <>
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Toggle fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={handleOpenExternal}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* URL Bar */}
      {previewUrl && (
        <div className="px-4 py-2 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground truncate">
              {previewUrl}
            </span>
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 relative min-h-0">
        {!previewUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {status === 'idle' ? (
              <div className="text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Monitor className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">No Preview</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Boot the container to see your app live
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground capitalize">
                    {status === 'booting' && 'Booting WebContainer...'}
                    {status === 'mounting' && 'Mounting Files...'}
                    {status === 'installing' && 'Installing Dependencies...'}
                    {status === 'starting' && 'Starting Dev Server...'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This may take a moment
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 bg-white animate-fade-in"
            title="App Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        )}
      </div>
    </div>
  );
}
