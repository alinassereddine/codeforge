/**
 * OpenRouter API Client
 * 
 * Handles streaming API calls to OpenRouter for AI code generation.
 * OpenRouter provides access to multiple AI models through a unified API.
 * 
 * @see https://openrouter.ai/docs
 */

import { SYSTEM_PROMPT } from './prompts';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Default model
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5';

/**
 * Available models on OpenRouter
 */
export const OPENROUTER_MODELS = [
    { id: 'kwaipilot/kat-coder-pro:free', name: 'Kat Coder Pro (Free)', provider: 'KwaiPilot' },
    { id: 'mistralai/devstral-2512:free', name: 'Devstral 2512 (Free)', provider: 'Mistral' },
    { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'Anthropic' },
    { id: 'xiaomi/mimo-v2-flash:free', name: 'Mimo v2 Flash (Free)', provider: 'Xiaomi' },
    { id: 'x-ai/grok-code-fast-1', name: 'Grok Code Fast 1', provider: 'xAI' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
    { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
    { id: 'z-ai/glm-4.7', name: 'GLM 4.7', provider: 'Zhipu AI' },
    { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', provider: 'OpenAI' },
    { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'Google' },
    { id: 'minimax/minimax-m2.1', name: 'Minimax M2.1', provider: 'MiniMax' },
    { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B', provider: 'OpenAI' },
    { id: 'moonshotai/kimi-k2-0905', name: 'Kimi k2 0905', provider: 'Moonshot AI' },
    { id: 'moonshotai/kimi-k2-thinking', name: 'Kimi k2 Thinking', provider: 'Moonshot AI' },
    { id: 'qwen/qwen3-coder', name: 'Qwen 3 Coder', provider: 'Qwen' },
] as const;

export type OpenRouterModel = typeof OPENROUTER_MODELS[number]['id'];

/**
 * Message format for OpenRouter API
 */
interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Options for streaming request
 */
interface StreamOptions {
    apiKey: string;
    model?: OpenRouterModel;
    messages: { role: 'user' | 'assistant'; content: string }[];
    onChunk: (chunk: string) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
    signal?: AbortSignal;
    systemPromptOverride?: string;
}

/**
 * Stream a chat completion from OpenRouter
 */
export async function streamOpenRouter({
    apiKey,
    model = DEFAULT_MODEL,
    messages,
    onChunk,
    onError,
    onComplete,
    signal,
    systemPromptOverride,
}: StreamOptions): Promise<void> {
    // Prepare messages with system prompt
    const apiMessages: ChatMessage[] = [
        { role: 'system', content: systemPromptOverride || SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'CodeForge',
            },
            body: JSON.stringify({
                model,
                messages: apiMessages,
                stream: true,
                max_tokens: 8192,
                temperature: 0.7,
            }),
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error?.message ||
                `OpenRouter API error: ${response.status} ${response.statusText}`
            );
        }

        if (!response.body) {
            throw new Error('No response body from OpenRouter');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                onComplete?.();
                break;
            }

            buffer += decoder.decode(value, { stream: true });

            // Process SSE lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                const trimmed = line.trim();

                if (!trimmed || trimmed === 'data: [DONE]') {
                    continue;
                }

                if (trimmed.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const content = json.choices?.[0]?.delta?.content;

                        if (content) {
                            onChunk(content);
                        }
                    } catch (e) {
                        // Ignore JSON parse errors for incomplete chunks
                    }
                }
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                console.log('[OpenRouter] Request aborted');
                return;
            }
            onError?.(error);
        } else {
            onError?.(new Error('Unknown error occurred'));
        }
    }
}

/**
 * Test the OpenRouter API connection
 */
export async function testOpenRouterConnection(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        return response.ok;
    } catch {
        return false;
    }
}
