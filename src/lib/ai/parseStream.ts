/**
 * Stream Parser for AI Responses
 * 
 * A state machine parser that processes incoming AI response chunks in real-time,
 * extracting boltArtifact/boltAction tags and applying file changes immediately.
 */

import type { WebContainer } from '@webcontainer/api';
import type { BoltActionType, ParsedAction } from './prompts';
import { useContainerStore } from '@/store/containerStore';
import { getFileTree } from '@/lib/webcontainer/container';

/**
 * Parser states for the state machine
 */
type ParserState =
    | 'IDLE'           // Waiting for <boltArtifact>
    | 'IN_ARTIFACT'    // Inside <boltArtifact>, waiting for <boltAction>
    | 'IN_FILE_ACTION' // Inside <boltAction type="file">, buffering content
    | 'IN_SHELL_ACTION'; // Inside <boltAction type="shell">, buffering command

/**
 * Events emitted by the parser during streaming
 */
export interface ParserEvents {
    onArtifactStart?: (id: string, title: string) => void;
    onArtifactEnd?: () => void;
    onActionStart?: (type: BoltActionType, filePath?: string) => void;
    onActionEnd?: (action: ParsedAction) => void;
    onFileWritten?: (filePath: string) => void;
    onShellCommand?: (command: string) => void;
    onText?: (text: string) => void;
    onError?: (error: Error) => void;
}

/**
 * StreamParser - Processes AI response chunks and applies file changes in real-time
 */
export class StreamParser {
    private state: ParserState = 'IDLE';
    private buffer: string = '';
    private currentAction: Partial<ParsedAction> | null = null;
    private contentBuffer: string = '';
    private container: WebContainer | null = null;
    private events: ParserEvents;

    constructor(container: WebContainer | null, events: ParserEvents = {}) {
        this.container = container;
        this.events = events;
    }

    /**
     * Process a chunk of streamed text
     */
    async processChunk(chunk: string): Promise<void> {
        this.buffer += chunk;

        // Emit raw text for display
        this.events.onText?.(chunk);

        // Process the buffer based on current state
        await this.processBuffer();
    }

    /**
     * Main processing loop - handles the buffer based on current state
     */
    private async processBuffer(): Promise<void> {
        let continueProcessing = true;

        while (continueProcessing) {
            switch (this.state) {
                case 'IDLE':
                    continueProcessing = this.handleIdle();
                    break;
                case 'IN_ARTIFACT':
                    continueProcessing = this.handleInArtifact();
                    break;
                case 'IN_FILE_ACTION':
                    continueProcessing = await this.handleInFileAction();
                    break;
                case 'IN_SHELL_ACTION':
                    continueProcessing = await this.handleInShellAction();
                    break;
                default:
                    continueProcessing = false;
            }
        }
    }

    /**
     * IDLE state: Looking for <boltArtifact> opening tag
     */
    private handleIdle(): boolean {
        const artifactMatch = this.buffer.match(/<boltArtifact\s+id="([^"]+)"\s+title="([^"]+)">/);

        if (artifactMatch) {
            const [fullMatch, id, title] = artifactMatch;
            const matchIndex = this.buffer.indexOf(fullMatch);

            // Remove everything up to and including the tag
            this.buffer = this.buffer.slice(matchIndex + fullMatch.length);
            this.state = 'IN_ARTIFACT';
            this.events.onArtifactStart?.(id, title);
            return true;
        }

        // Also check for closing artifact to handle any edge cases
        if (this.buffer.includes('</boltArtifact>')) {
            const closeIndex = this.buffer.indexOf('</boltArtifact>');
            this.buffer = this.buffer.slice(closeIndex + '</boltArtifact>'.length);
            this.events.onArtifactEnd?.();
        }

        return false;
    }

    /**
     * IN_ARTIFACT state: Looking for <boltAction> or </boltArtifact>
     */
    private handleInArtifact(): boolean {
        // Check for file action
        const fileActionMatch = this.buffer.match(/<boltAction\s+type="file"\s+filePath="([^"]+)">/);
        if (fileActionMatch) {
            const [fullMatch, filePath] = fileActionMatch;
            const matchIndex = this.buffer.indexOf(fullMatch);

            this.buffer = this.buffer.slice(matchIndex + fullMatch.length);
            this.state = 'IN_FILE_ACTION';
            this.currentAction = { type: 'file', filePath, content: '' };
            this.contentBuffer = '';
            this.events.onActionStart?.('file', filePath);
            return true;
        }

        // Check for shell action
        const shellActionMatch = this.buffer.match(/<boltAction\s+type="shell">/);
        if (shellActionMatch) {
            const [fullMatch] = shellActionMatch;
            const matchIndex = this.buffer.indexOf(fullMatch);

            this.buffer = this.buffer.slice(matchIndex + fullMatch.length);
            this.state = 'IN_SHELL_ACTION';
            this.currentAction = { type: 'shell', content: '' };
            this.contentBuffer = '';
            this.events.onActionStart?.('shell');
            return true;
        }

        // Check for artifact end
        if (this.buffer.includes('</boltArtifact>')) {
            const closeIndex = this.buffer.indexOf('</boltArtifact>');
            this.buffer = this.buffer.slice(closeIndex + '</boltArtifact>'.length);
            this.state = 'IDLE';
            this.events.onArtifactEnd?.();
            return true;
        }

        return false;
    }

    /**
     * IN_FILE_ACTION state: Buffering file content until </boltAction>
     */
    private async handleInFileAction(): Promise<boolean> {
        const closeTag = '</boltAction>';
        const closeIndex = this.buffer.indexOf(closeTag);

        if (closeIndex !== -1) {
            // Extract content before the closing tag
            this.contentBuffer += this.buffer.slice(0, closeIndex);
            this.buffer = this.buffer.slice(closeIndex + closeTag.length);

            // Trim the content (remove leading/trailing whitespace)
            const content = this.contentBuffer.trim();
            const filePath = this.currentAction?.filePath;

            if (filePath && content) {
                // Write file to WebContainer
                await this.writeFile(filePath, content);

                const action: ParsedAction = {
                    type: 'file',
                    filePath,
                    content,
                };
                this.events.onActionEnd?.(action);
            }

            // Reset and go back to artifact state
            this.currentAction = null;
            this.contentBuffer = '';
            this.state = 'IN_ARTIFACT';
            return true;
        } else {
            // Keep buffering - save everything except the last few chars
            // (in case the closing tag is split across chunks)
            const safeLength = Math.max(0, this.buffer.length - closeTag.length);
            this.contentBuffer += this.buffer.slice(0, safeLength);
            this.buffer = this.buffer.slice(safeLength);
        }

        return false;
    }

    /**
     * IN_SHELL_ACTION state: Buffering shell command until </boltAction>
     */
    private async handleInShellAction(): Promise<boolean> {
        const closeTag = '</boltAction>';
        const closeIndex = this.buffer.indexOf(closeTag);

        if (closeIndex !== -1) {
            // Extract command before the closing tag
            this.contentBuffer += this.buffer.slice(0, closeIndex);
            this.buffer = this.buffer.slice(closeIndex + closeTag.length);

            // Trim and execute the command
            const command = this.contentBuffer.trim();

            if (command) {
                this.events.onShellCommand?.(command);

                const action: ParsedAction = {
                    type: 'shell',
                    content: command,
                };
                this.events.onActionEnd?.(action);
            }

            // Reset and go back to artifact state
            this.currentAction = null;
            this.contentBuffer = '';
            this.state = 'IN_ARTIFACT';
            return true;
        } else {
            // Keep buffering
            const safeLength = Math.max(0, this.buffer.length - closeTag.length);
            this.contentBuffer += this.buffer.slice(0, safeLength);
            this.buffer = this.buffer.slice(safeLength);
        }

        return false;
    }

    /**
     * Write a file to the WebContainer
     */
    private async writeFile(filePath: string, content: string): Promise<void> {
        if (!this.container) {
            console.warn('WebContainer not available, skipping file write:', filePath);
            return;
        }

        try {
            // Ensure directory exists
            const dirPath = filePath.split('/').slice(0, -1).join('/');
            if (dirPath) {
                await this.ensureDirectory(dirPath);
            }

            // Write the file
            await this.container.fs.writeFile(filePath, content);
            console.log(`[StreamParser] Written: ${filePath}`);

            // FORCE REFRESH: Update UI file tree immediately after write
            try {
                const newTree = await getFileTree(this.container);
                useContainerStore.getState().setFileTree(newTree);
                console.log(`[StreamParser] File tree refreshed after writing: ${filePath}`);
            } catch (refreshError) {
                console.error('[StreamParser] Failed to refresh file tree:', refreshError);
            }

            // Notify listeners
            this.events.onFileWritten?.(filePath);
        } catch (error) {
            console.error(`[StreamParser] Failed to write ${filePath}:`, error);
            this.events.onError?.(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Recursively ensure a directory exists
     */
    private async ensureDirectory(dirPath: string): Promise<void> {
        if (!this.container) return;

        const parts = dirPath.split('/').filter(Boolean);
        let currentPath = '';

        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            try {
                await this.container.fs.mkdir(currentPath);
            } catch {
                // Directory might already exist, ignore error
            }
        }
    }

    /**
     * Finalize parsing - called when stream ends
     */
    finalize(): void {
        // Handle any remaining content in the buffer
        if (this.state !== 'IDLE' && this.contentBuffer) {
            console.warn('[StreamParser] Stream ended with incomplete action');
        }

        // Reset state
        this.state = 'IDLE';
        this.buffer = '';
        this.contentBuffer = '';
        this.currentAction = null;
    }

    /**
     * Get current parser state (for debugging)
     */
    getState(): ParserState {
        return this.state;
    }
}

/**
 * Helper function to create a parser with common event handlers
 */
export function createStreamParser(
    container: WebContainer | null,
    options: {
        onFileWritten?: (filePath: string) => void;
        onShellCommand?: (command: string) => void;
        onText?: (text: string) => void;
    } = {}
): StreamParser {
    return new StreamParser(container, {
        onFileWritten: options.onFileWritten,
        onShellCommand: options.onShellCommand,
        onText: options.onText,
        onError: (error) => console.error('[StreamParser Error]', error),
    });
}
