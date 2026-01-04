import { WebContainer } from '@webcontainer/api';
import type { FileSystemTree } from '@webcontainer/api';
import { debouncedSave } from '@/lib/persistence';

let webcontainerInstance: WebContainer | null = null;

export type TerminalOutput = {
  type: 'stdout' | 'stderr' | 'info' | 'success' | 'error';
  text: string;
  timestamp: Date;
};

export type ContainerStatus =
  | 'idle'
  | 'booting'
  | 'mounting'
  | 'installing'
  | 'starting'
  | 'ready'
  | 'error';

export interface ContainerState {
  status: ContainerStatus;
  previewUrl: string | null;
  terminalOutput: TerminalOutput[];
  error: string | null;
}

/**
 * Boot the WebContainer instance
 * WebContainer can only be booted once per page load
 */
export async function bootWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  // Check for cross-origin isolation (required for SharedArrayBuffer)
  if (!crossOriginIsolated) {
    throw new Error(
      'WebContainers require cross-origin isolation. ' +
      'Ensure COOP/COEP headers are set correctly.'
    );
  }

  webcontainerInstance = await WebContainer.boot();
  return webcontainerInstance;
}

/**
 * Mount files to the WebContainer file system
 */
export async function mountFiles(
  container: WebContainer,
  files: FileSystemTree
): Promise<void> {
  await container.mount(files);
}

/**
 * Run npm install in the container
 * Uses silent flags to avoid flooding the terminal with HTTP fetch logs
 */
export async function installDependencies(
  container: WebContainer,
  onOutput: (output: TerminalOutput) => void
): Promise<boolean> {
  // Show clean status message instead of noisy npm output
  onOutput({
    type: 'info',
    text: '📦 Installing dependencies... (This usually takes 30-60 seconds)\n',
    timestamp: new Date(),
  });

  // Use silent flags to suppress fetch logs and warnings
  const installProcess = await container.spawn('npm', [
    'install',
    '--no-fund',
    '--no-audit',
    '--loglevel=error',
    '--progress=false'
  ]);

  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        // Filter out noisy output - only show actual errors
        const text = data.toString();

        // Skip common noise patterns
        if (
          text.includes('npm WARN') ||
          text.includes('npm notice') ||
          text.includes('http fetch') ||
          text.includes('GET https://registry') ||
          text.includes('reify:') ||
          text.trim() === '' ||
          /^\s*$/.test(text)
        ) {
          return; // Silently ignore
        }

        // Only output if it looks like an actual error or important info
        if (text.includes('npm ERR') || text.includes('error')) {
          onOutput({
            type: 'error',
            text: text,
            timestamp: new Date(),
          });
        }
      },
    })
  );

  const exitCode = await installProcess.exit;

  // Show completion message
  if (exitCode === 0) {
    onOutput({
      type: 'success',
      text: '✓ Dependencies installed successfully\n',
      timestamp: new Date(),
    });
  }

  return exitCode === 0;
}

/**
 * Start the Vite dev server
 */
export async function startDevServer(
  container: WebContainer,
  onOutput: (output: TerminalOutput) => void,
  onServerReady: (url: string) => void
): Promise<void> {
  const serverProcess = await container.spawn('npm', ['run', 'dev']);

  serverProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        onOutput({
          type: 'stdout',
          text: data,
          timestamp: new Date(),
        });
      },
    })
  );

  // Wait for server-ready event
  container.on('server-ready', (port, url) => {
    onOutput({
      type: 'success',
      text: `\n🚀 Server ready on port ${port}\n`,
      timestamp: new Date(),
    });
    onServerReady(url);
  });
}

/**
 * Execute a shell command in the container
 */
export async function executeShellCommand(
  container: WebContainer,
  command: string,
  onOutput: (output: TerminalOutput) => void
): Promise<void> {
  const [cmd, ...args] = command.trim().split(' ');

  if (!cmd) return;

  // Echo command
  onOutput({
    type: 'info',
    text: `$ ${command}\n`,
    timestamp: new Date(),
  });

  try {
    const process = await container.spawn(cmd, args);

    process.output.pipeTo(
      new WritableStream({
        write(data) {
          onOutput({
            type: 'stdout',
            text: data,
            timestamp: new Date(),
          });
        },
      })
    );

    const exitCode = await process.exit;

    if (exitCode !== 0) {
      onOutput({
        type: 'error',
        text: `Command failed with exit code ${exitCode}\n`,
        timestamp: new Date(),
      });
    }
  } catch (error) {
    onOutput({
      type: 'error',
      text: `Failed to execute command: ${error}\n`,
      timestamp: new Date(),
    });
  }
}

/**
 * Get the current WebContainer instance
 */
export function getWebContainerInstance(): WebContainer | null {
  return webcontainerInstance;
}

/**
 * Write a single file to the container
 */
export async function writeFile(
  container: WebContainer,
  path: string,
  contents: string
): Promise<void> {
  await container.fs.writeFile(path, contents);
  debouncedSave(container);
}

/**
 * Read a file from the container
 */
export async function readFile(
  container: WebContainer,
  path: string
): Promise<string> {
  return await container.fs.readFile(path, 'utf-8');
}

/**
 * Scan the WebContainer file system and return a FileNode tree
 * Used to sync the File Explorer UI with the actual VFS state
 */
export async function getFileTree(
  container: WebContainer,
  dirPath: string = '.'
): Promise<FileNode[]> {
  const nodes: FileNode[] = [];

  try {
    const entries = await container.fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = dirPath === '.' ? entry.name : `${dirPath}/${entry.name}`;

      // Skip node_modules and hidden files for performance
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }

      if (entry.isDirectory()) {
        const children = await getFileTree(container, entryPath);
        nodes.push({
          name: entry.name,
          path: entryPath,
          type: 'directory',
          children,
        });
      } else {
        // Read file content
        let content = '';
        try {
          content = await container.fs.readFile(entryPath, 'utf-8');
        } catch {
          // Binary file or read error, skip content
        }

        nodes.push({
          name: entry.name,
          path: entryPath,
          type: 'file',
          content,
        });
      }
    }
  } catch (error) {
    console.error(`[getFileTree] Error reading ${dirPath}:`, error);
  }

  // Sort: directories first, then files, alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

// Re-export FileNode type for convenience
import type { FileNode } from '@/store/containerStore';
export type { FileNode };
