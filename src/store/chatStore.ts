/**
 * Chat Store - State management for Chat Interface
 * 
 * Manages chat messages, streaming state, and API key persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Chat message types
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

/**
 * API Provider options
 */
/**
 * API Provider options
 */
export type ApiProvider = 'anthropic' | 'openai' | 'gemini' | 'openrouter';

/**
 * Chat Mode options
 */
export type ChatMode = 'agent' | 'chat';

/**
 * Chat store state interface
 */
interface ChatStore {
    // Messages
    messages: ChatMessage[];

    // Streaming state
    isStreaming: boolean;
    currentStreamId: string | null;

    // API configuration
    // API configuration
    apiKey: string;
    apiProvider: ApiProvider;
    selectedModel: string;
    chatMode: ChatMode;

    // UI state
    isChatOpen: boolean;
    isSettingsOpen: boolean;

    // Actions - Messages
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
    updateMessage: (id: string, content: string) => void;
    appendToMessage: (id: string, chunk: string) => void;
    clearMessages: () => void;

    // Actions - Streaming
    startStreaming: () => string;
    stopStreaming: () => void;

    // Actions - API
    setApiKey: (key: string) => void;
    setApiProvider: (provider: ApiProvider) => void;
    setSelectedModel: (model: string) => void;
    setChatMode: (mode: ChatMode) => void;

    // Actions - UI
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    toggleSettings: () => void;
    openSettings: () => void;
    closeSettings: () => void;
}

/**
 * Generate a unique ID for messages
 */
function generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Chat store with persistence for API key
 */
export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            // Initial state
            messages: [],
            isStreaming: false,
            currentStreamId: null,
            apiKey: '',
            apiProvider: 'openrouter',
            selectedModel: 'anthropic/claude-sonnet-4.5',
            chatMode: 'agent',
            isChatOpen: false,
            isSettingsOpen: false,

            // Message actions
            addMessage: (message) => {
                const id = generateId();
                const newMessage: ChatMessage = {
                    ...message,
                    id,
                    timestamp: new Date(),
                };

                set((state) => ({
                    messages: [...state.messages, newMessage],
                }));

                return id;
            },

            updateMessage: (id, content) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg.id === id ? { ...msg, content, isStreaming: false } : msg
                    ),
                }));
            },

            appendToMessage: (id, chunk) => {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg.id === id ? { ...msg, content: msg.content + chunk } : msg
                    ),
                }));
            },

            clearMessages: () => {
                set({ messages: [] });
            },

            // Streaming actions
            startStreaming: () => {
                const streamId = generateId();

                // Add placeholder message for streaming
                const messageId = get().addMessage({
                    role: 'assistant',
                    content: '',
                    isStreaming: true,
                });

                set({
                    isStreaming: true,
                    currentStreamId: messageId,
                });

                return messageId;
            },

            stopStreaming: () => {
                const { currentStreamId } = get();

                if (currentStreamId) {
                    set((state) => ({
                        isStreaming: false,
                        currentStreamId: null,
                        messages: state.messages.map((msg) =>
                            msg.id === currentStreamId ? { ...msg, isStreaming: false } : msg
                        ),
                    }));
                } else {
                    set({ isStreaming: false, currentStreamId: null });
                }
            },

            // API actions
            setApiKey: (key) => {
                set({ apiKey: key });
            },

            setApiProvider: (provider) => {
                set({ apiProvider: provider });
            },

            setSelectedModel: (model) => {
                set({ selectedModel: model });
            },

            setChatMode: (mode) => {
                set({ chatMode: mode });
            },

            // UI actions
            toggleChat: () => {
                set((state) => ({ isChatOpen: !state.isChatOpen }));
            },

            openChat: () => {
                set({ isChatOpen: true });
            },

            closeChat: () => {
                set({ isChatOpen: false });
            },

            toggleSettings: () => {
                set((state) => ({ isSettingsOpen: !state.isSettingsOpen }));
            },

            openSettings: () => {
                set({ isSettingsOpen: true });
            },

            closeSettings: () => {
                set({ isSettingsOpen: false });
            },
        }),
        {
            name: 'codeforge-chat-storage',
            // Only persist API key, provider, and selected model
            partialize: (state) => ({
                apiKey: state.apiKey,
                apiProvider: state.apiProvider,
                selectedModel: state.selectedModel,
                chatMode: state.chatMode,
            }),
        }
    )
);
