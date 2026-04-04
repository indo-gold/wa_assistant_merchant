/**
 * ============================================================================
 * BASE AI PROVIDER
 * ============================================================================
 * 
 * Abstract class untuk AI provider (OpenAI, Groq, Deepseek, dll).
 * Menyediakan interface yang konsisten untuk berbagai AI provider.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import OpenAI from 'openai';

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

/**
 * Completion request
 */
export interface CompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
      strict?: boolean;
    };
  }>;
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
  parallel_tool_calls?: boolean;
  store?: boolean;
}

/**
 * Completion response
 */
export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    input_tokens?: number;
    output_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
    input_tokens_details?: { cached_tokens?: number };
  };
}

/**
 * Abstract base provider class
 */
export abstract class BaseAiProvider {
  protected client: OpenAI;
  protected readonly name: string;

  constructor(name: string, baseURL: string, apiKey: string, timeout: number = 30000) {
    this.name = name;
    this.client = new OpenAI({ baseURL, apiKey, timeout });
  }

  /**
   * Get provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Create chat completion
   */
  abstract createCompletion(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Create transcription (audio to text)
   */
  abstract createTranscription(audioFile: Buffer, model: string): Promise<string>;

  /**
   * Check if provider supports vision
   */
  abstract supportsVision(): boolean;

  /**
   * Check if provider supports function calling
   */
  abstract supportsFunctionCalling(): boolean;
}
