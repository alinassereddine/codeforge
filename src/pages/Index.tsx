import { useState } from 'react';
import { Header } from '@/components/Header';
import { FileExplorer } from '@/components/FileExplorer';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPane } from '@/components/PreviewPane';
import { Terminal } from '@/components/Terminal';
import { ChatPanel } from '@/components/ChatPanel';
import {
  TerminalSquare,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  FolderTree,
  Code2,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContainerStore } from '@/store/containerStore';
import { cn } from '@/lib/utils';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

const Index = () => {
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);
  const [isExplorerVisible, setIsExplorerVisible] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const { status } = useContainerStore();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsed Sidebar Toggle Buttons (when panels are hidden) */}
        {(!isExplorerVisible || !isChatVisible || !isEditorVisible) && (
          <div className="flex flex-col bg-card border-r border-border">
            {!isExplorerVisible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none border-b border-border"
                onClick={() => setIsExplorerVisible(true)}
                title="Show Explorer"
              >
                <FolderTree className="w-4 h-4" />
              </Button>
            )}
            {!isChatVisible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none border-b border-border"
                onClick={() => setIsChatVisible(true)}
                title="Show AI Chat"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            )}
            {!isEditorVisible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none border-b border-border"
                onClick={() => setIsEditorVisible(true)}
                title="Show Editor"
              >
                <Code2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* File Explorer Sidebar (Fixed Width) */}
        {isExplorerVisible && (
          <div className="relative w-52 flex-shrink-0 border-r border-border">
            <FileExplorer />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 z-10"
              onClick={() => setIsExplorerVisible(false)}
              title="Hide Explorer"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Main Resizable Area: Chat / Editor+Terminal / Preview */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* AI Chat Panel (Resizable) */}
          {isChatVisible && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                <div className="h-full relative">
                  <ChatPanel />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-8 h-6 w-6 z-10"
                    onClick={() => setIsChatVisible(false)}
                    title="Hide Chat"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Editor + Terminal Panel */}
          {isEditorVisible && (
            <>
              <ResizablePanel defaultSize={isChatVisible ? 45 : 55} minSize={25}>
                <div className="h-full flex flex-col relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 z-10"
                    onClick={() => setIsEditorVisible(false)}
                    title="Hide Editor"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {isTerminalVisible ? (
                    <ResizablePanelGroup direction="vertical" className="h-full">
                      <ResizablePanel defaultSize={75} minSize={30}>
                        <div className="h-full flex flex-col">
                          <CodeEditor />
                        </div>
                      </ResizablePanel>

                      <ResizableHandle withHandle />

                      <ResizablePanel defaultSize={25} minSize={10}>
                        <div className="h-full flex flex-col">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-card border-b border-border">
                            <div className="flex items-center gap-2">
                              <TerminalSquare className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Terminal</span>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-mono",
                                status === 'ready' && "bg-success/20 text-success",
                                status === 'error' && "bg-destructive/20 text-destructive",
                                (status === 'booting' || status === 'installing' || status === 'starting' || status === 'mounting') && "bg-primary/20 text-primary animate-pulse",
                                status === 'idle' && "bg-muted text-muted-foreground"
                              )}>
                                {status}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setIsTerminalVisible(false)}
                              title="Hide Terminal"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <Terminal />
                          </div>
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : (
                    <>
                      <div className="flex-1">
                        <CodeEditor />
                      </div>
                      <div
                        className="flex items-center justify-between px-3 py-1.5 bg-card border-t border-border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setIsTerminalVisible(true)}
                      >
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <TerminalSquare className="w-3.5 h-3.5" />
                          <span>Terminal</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Show Terminal">
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Preview Panel */}
          <ResizablePanel defaultSize={isChatVisible && isEditorVisible ? 35 : isEditorVisible ? 45 : 100} minSize={20}>
            <PreviewPane />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
