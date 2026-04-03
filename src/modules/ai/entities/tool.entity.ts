/**
 * ============================================================================
 * TOOL ENTITY
 * ============================================================================
 * 
 * Entity untuk AI Tool/Function.
 * Mendefinisikan struktur tool yang bisa dipanggil oleh AI.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  type: string;
  description?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  default?: unknown;
  items?: unknown;
  properties?: Record<string, ToolParameter>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Tool function definition
 */
export interface ToolFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
    additionalProperties: boolean;
    strict?: boolean;
  };
  strict?: boolean;
}

/**
 * Tool definition untuk OpenAI function calling
 */
export interface ToolDefinition {
  type: 'function';
  function: ToolFunction;
}

/**
 * Tool call result
 */
export interface ToolResult {
  success: boolean;
  data: unknown;
  message?: string;
  skipLLM?: boolean; // Flag untuk langsung kirim WA tanpa LLM
}

/**
 * Tool handler function type
 */
export type ToolHandler = (
  args: Record<string, unknown>,
  context: ToolContext,
) => Promise<ToolResult>;

/**
 * Tool context yang diterima handler
 */
export interface ToolContext {
  userPhone: string;
  userName: string;
  userId: number;
  messageId: string;
  replyMessageId?: string;
  conversationHistory: Array<{ role: string; content: string }>;
}

/**
 * Registered tool
 */
export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}
