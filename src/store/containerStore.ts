import { create } from 'zustand';
import type { WebContainer } from '@webcontainer/api';
import type { ContainerStatus, TerminalOutput } from '@/lib/webcontainer/container';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
}

export interface ActiveFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
}

interface ContainerStore {
  // Container State
  container: WebContainer | null;
  status: ContainerStatus;
  previewUrl: string | null;
  terminalOutput: TerminalOutput[];
  error: string | null;
  
  // File System State
  fileTree: FileNode[];
  activeFile: ActiveFile | null;
  openFiles: ActiveFile[];
  
  // Container Actions
  setContainer: (container: WebContainer) => void;
  setStatus: (status: ContainerStatus) => void;
  setPreviewUrl: (url: string | null) => void;
  addTerminalOutput: (output: TerminalOutput) => void;
  clearTerminalOutput: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
  
  // File System Actions
  setFileTree: (tree: FileNode[]) => void;
  setActiveFile: (file: ActiveFile | null) => void;
  updateFileContent: (path: string, content: string) => void;
  openFile: (file: ActiveFile) => void;
  closeFile: (path: string) => void;
  markFileSaved: (path: string) => void;
}

const initialState = {
  container: null,
  status: 'idle' as ContainerStatus,
  previewUrl: null,
  terminalOutput: [],
  error: null,
  fileTree: [],
  activeFile: null,
  openFiles: [],
};

export const useContainerStore = create<ContainerStore>((set, get) => ({
  ...initialState,

  // Container Actions
  setContainer: (container) => set({ container }),
  setStatus: (status) => set({ status }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  
  addTerminalOutput: (output) =>
    set((state) => ({
      terminalOutput: [...state.terminalOutput, output],
    })),
  
  clearTerminalOutput: () => set({ terminalOutput: [] }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  reset: () => set(initialState),

  // File System Actions
  setFileTree: (tree) => set({ fileTree: tree }),
  
  setActiveFile: (file) => set({ activeFile: file }),
  
  openFile: (file) => {
    const { openFiles } = get();
    const exists = openFiles.find(f => f.path === file.path);
    
    if (!exists) {
      set({ 
        openFiles: [...openFiles, file],
        activeFile: file 
      });
    } else {
      set({ activeFile: exists });
    }
  },
  
  closeFile: (path) => {
    const { openFiles, activeFile } = get();
    const filtered = openFiles.filter(f => f.path !== path);
    
    let newActive = activeFile;
    if (activeFile?.path === path) {
      newActive = filtered.length > 0 ? filtered[filtered.length - 1] : null;
    }
    
    set({ openFiles: filtered, activeFile: newActive });
  },
  
  updateFileContent: (path, content) => {
    const { openFiles, activeFile } = get();
    
    const updatedFiles = openFiles.map(f => 
      f.path === path ? { ...f, content, isDirty: true } : f
    );
    
    const updatedActive = activeFile?.path === path 
      ? { ...activeFile, content, isDirty: true }
      : activeFile;
    
    set({ openFiles: updatedFiles, activeFile: updatedActive });
  },
  
  markFileSaved: (path) => {
    const { openFiles, activeFile } = get();
    
    const updatedFiles = openFiles.map(f => 
      f.path === path ? { ...f, isDirty: false } : f
    );
    
    const updatedActive = activeFile?.path === path 
      ? { ...activeFile, isDirty: false }
      : activeFile;
    
    set({ openFiles: updatedFiles, activeFile: updatedActive });
  },
}));
