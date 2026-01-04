import type { FileSystemTree } from '@webcontainer/api';
import type { FileNode } from '@/store/containerStore';

/**
 * Virtual File System Template
 * A minimal React + Vite application to be mounted in WebContainer
 */
export const virtualFileSystem: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: 'generated-app',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.0.0',
          typescript: '^5.0.0',
          vite: '^5.0.0',
        },
      }, null, 2),
    },
  },
  'vite.config.js': {
    file: {
      contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  }
})`,
    },
  },
  'index.html': {
    file: {
      contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
        min-height: 100vh;
        color: white;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
    },
  },
  src: {
    directory: {
      'main.jsx': {
        file: {
          contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
        },
      },
      'App.jsx': {
        file: {
          contents: `import React, { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '24px',
        padding: '3rem',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        maxWidth: '500px',
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem',
        }}>⚡</div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          App Generated!
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '1.1rem',
          marginBottom: '2rem',
        }}>
          Your React app is running in WebContainer
        </p>
        <button
          onClick={() => setCount(c => c + 1)}
          style={{
            background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
            border: 'none',
            borderRadius: '12px',
            padding: '1rem 2rem',
            color: '#0a0a0a',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 6px 25px rgba(0,212,255,0.4)'
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 20px rgba(0,212,255,0.3)'
          }}
        >
          Count: {count}
        </button>
      </div>
    </div>
  )
}

export default App`,
        },
      },
    },
  },
};

/**
 * Convert FileSystemTree to FileNode array for the UI
 */
export function fileSystemTreeToNodes(
  tree: FileSystemTree,
  basePath: string = ''
): FileNode[] {
  const nodes: FileNode[] = [];

  for (const [name, entry] of Object.entries(tree)) {
    const path = basePath ? `${basePath}/${name}` : name;

    if ('file' in entry && 'contents' in entry.file) {
      nodes.push({
        name,
        path,
        type: 'file',
        content: typeof entry.file.contents === 'string' ? entry.file.contents : '',
      });
    } else if ('directory' in entry) {
      nodes.push({
        name,
        path,
        type: 'directory',
        children: fileSystemTreeToNodes(entry.directory, path),
      });
    }
  }

  // Sort: directories first, then files, alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get file content from the tree by path
 */
export function getFileContent(path: string): string | null {
  const nodes = fileSystemTreeToNodes(virtualFileSystem);
  
  function findFile(nodes: FileNode[], targetPath: string): string | null {
    for (const node of nodes) {
      if (node.path === targetPath && node.type === 'file') {
        return node.content || null;
      }
      if (node.children) {
        const found = findFile(node.children, targetPath);
        if (found !== null) return found;
      }
    }
    return null;
  }
  
  return findFile(nodes, path);
}

/**
 * Detect Monaco language from file extension
 */
export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    svg: 'xml',
  };
  
  return languageMap[ext || ''] || 'plaintext';
}
