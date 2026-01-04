import { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode2,
  FileJson,
  FileText,
  File,
  ChevronRight,
  ChevronDown,
  FolderTree
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContainerStore, type FileNode, type ActiveFile } from '@/store/containerStore';
import {
  virtualFileSystem,
  fileSystemTreeToNodes,
  getLanguageFromPath
} from '@/lib/webcontainer/files';

function getFileIcon(name: string, className: string = "w-4 h-4") {
  const ext = name.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'json':
      return <FileJson className={cn(className, "text-yellow-500")} />;
    case 'jsx':
    case 'tsx':
      return <FileCode2 className={cn(className, "text-primary")} />;
    case 'js':
    case 'ts':
      return <FileCode2 className={cn(className, "text-yellow-400")} />;
    case 'html':
      return <FileText className={cn(className, "text-orange-500")} />;
    case 'css':
    case 'scss':
      return <FileText className={cn(className, "text-blue-400")} />;
    case 'md':
      return <FileText className={cn(className, "text-gray-400")} />;
    default:
      return <File className={cn(className, "text-muted-foreground")} />;
  }
}

interface FileTreeItemProps {
  node: FileNode;
  depth?: number;
}

function FileTreeItem({ node, depth = 0 }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const { activeFile, openFile } = useContainerStore();

  const isActive = activeFile?.path === node.path;
  const paddingLeft = depth * 12 + 8;

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen);
    } else {
      const file: ActiveFile = {
        path: node.path,
        name: node.name,
        content: node.content || '',
        language: getLanguageFromPath(node.path),
        isDirty: false,
      };
      openFile(file);
    }
  };

  return (
    <div className="select-none">
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2 py-1.5 pr-2 text-sm transition-colors rounded-md",
          "hover:bg-sidebar-accent",
          isActive && "bg-sidebar-accent text-sidebar-primary"
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {node.type === 'directory' ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 flex-shrink-0" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className={cn(
          "truncate",
          isActive ? "text-sidebar-primary font-medium" : "text-sidebar-foreground"
        )}>
          {node.name}
        </span>
      </button>

      {node.type === 'directory' && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer() {
  const { fileTree, setFileTree } = useContainerStore();

  // Initialize file tree from VFS on first render if empty
  useMemo(() => {
    if (fileTree.length === 0) {
      const nodes = fileSystemTreeToNodes(virtualFileSystem);
      setFileTree(nodes);
    }
  }, [fileTree.length, setFileTree]);

  return (
    <aside className="w-full h-full bg-sidebar flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-sidebar-border flex-shrink-0">
        <FolderTree className="w-4 h-4 text-sidebar-primary" />
        <span className="text-sm font-medium text-sidebar-foreground">Explorer</span>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {fileTree.map((node) => (
          <FileTreeItem key={node.path} node={node} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border flex-shrink-0">
        <p className="text-xs text-muted-foreground">
          {fileTree.length} items
        </p>
      </div>
    </aside>
  );
}
