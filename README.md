# ⚡ CodeForge

**AI-Powered Text-to-App Engine** — Transform natural language into working applications in real-time.

![CodeForge](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![WebContainer](https://img.shields.io/badge/WebContainer-API-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Overview

CodeForge is a browser-based development environment that uses AI to generate, edit, and run applications entirely in your browser. Powered by WebContainer technology, it creates a full Node.js environment without any server-side infrastructure.

**Key Features:**
- 🤖 **AI Code Generation** — Describe what you want, watch it build
- 📁 **Live File Explorer** — Real-time updates as files are created
- ✏️ **Monaco Editor** — Full-featured code editing with syntax highlighting
- 👁️ **Instant Preview** — See your app running immediately
- 🖥️ **Integrated Terminal** — Full terminal output and command execution
- 🎨 **Theme Switcher** — Dark, Light, and Night Blue themes
- 📱 **Resizable Panels** — Customize your workspace layout

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/codeforge.git

# Navigate to project directory
cd codeforge

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           Header                                │
│                    [Theme] [Boot Container]                     │
├────────┬──────────┬─────────────────────┬───────────────────────┤
│  File  │    AI    │      Editor         │       Preview         │
│Explorer│   Chat   │    ────────────     │     (Live App)        │
│   📁   │    💬    │      Terminal       │         👁️            │
└────────┴──────────┴─────────────────────┴───────────────────────┘
```

### Core Components

| Component | Description |
|-----------|-------------|
| `Header` | App controls, theme switcher, container boot button |
| `FileExplorer` | Virtual file system browser with live updates |
| `ChatPanel` | AI assistant with collapsible code generation |
| `CodeEditor` | Monaco-based editor with multi-file support |
| `Terminal` | Real-time output from WebContainer |
| `PreviewPane` | Live iframe preview of running application |

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State**: Zustand (with localStorage persistence)
- **Editor**: Monaco Editor
- **Runtime**: WebContainer API (in-browser Node.js)
- **AI**: Streaming XML parser for code generation

## 📂 Project Structure

```
src/
├── components/          # React UI components
│   ├── ChatPanel.tsx    # AI chat with collapsible artifacts
│   ├── CodeEditor.tsx   # Monaco editor wrapper
│   ├── FileExplorer.tsx # File tree with live updates
│   ├── Header.tsx       # App header with controls
│   ├── PreviewPane.tsx  # Live app preview
│   └── Terminal.tsx     # Terminal output display
├── lib/
│   ├── ai/
│   │   ├── parseStream.ts  # XML streaming parser
│   │   └── prompts.ts      # AI system prompts
│   └── webcontainer/
│       ├── container.ts    # WebContainer utilities
│       └── files.ts        # Virtual file system
├── store/
│   ├── chatStore.ts      # Chat state management
│   ├── containerStore.ts # WebContainer state
│   └── themeStore.ts     # Theme persistence
└── pages/
    └── Index.tsx         # Main layout with resizable panels
```

## 🎨 Themes

CodeForge includes three built-in themes:

| Theme | Description |
|-------|-------------|
| 🌙 **Dark** | Default dark IDE theme with cyan accents |
| ☀️ **Light** | Clean light theme with blue accents |
| 💎 **Night Blue** | Deep blue-based dark theme |

Access via Settings (⚙️) in the header.

## 🔧 Configuration

### AI Providers

Currently supports mock mode for testing. To integrate real AI:

1. Click Settings (⚙️) in the AI Chat panel
2. Select provider (Anthropic/OpenAI)
3. Enter your API key

### Panel Visibility

All panels can be hidden/shown:
- **File Explorer**: Click ← button or icon in sidebar
- **AI Chat**: Click ← button or 💬 icon
- **Editor/Terminal**: Click ← button or 📝 icon
- **Terminal**: Click ↓/↑ to collapse/expand

## 📝 How It Works

1. **User Input**: Describe what you want to build
2. **AI Generation**: AI streams XML with file actions
3. **Stream Parser**: Parses XML in real-time, extracts files
4. **WebContainer**: Files written to in-browser Node.js
5. **Live Preview**: Vite dev server shows result immediately

```xml
<boltArtifact id="my-app" title="My Application">
  <boltAction type="file" filePath="src/App.jsx">
    // Generated code here
  </boltAction>
</boltArtifact>
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ⚡ by the CodeForge Team
</p>
