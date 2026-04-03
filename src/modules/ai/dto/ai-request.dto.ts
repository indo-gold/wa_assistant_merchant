/**
 * ============================================================================
 * AI REQUEST DTO
 * ============================================================================
 * 
 * DTO untuk AI completion request.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject } from 'class-validator';

export class AiMessageDto {
  @IsString()
  @IsNotEmpty()
  role!: 'system' | 'user' | 'assistant' | 'tool';

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  tool_call_id?: string;

  @IsOptional()
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

export class AiRequestDto {
  @IsString()
  @IsNotEmpty()
  agentName!: string; // 'AI Utama', 'Agent Response', dll

  @IsArray()
  @IsNotEmpty()
  messages!: AiMessageDto[];

  @IsString()
  @IsOptional()
  userPhone?: string; // Untuk tracking cost

  @IsString()
  @IsOptional()
  waMessageId?: string; // Reference ke pesan WA

  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>; // Additional context
}

export class AiToolCallDto {
  @IsString()
  @IsNotEmpty()
  toolCallId!: string;

  @IsString()
  @IsNotEmpty()
  functionName!: string;

  @IsObject()
  @IsNotEmpty()
  arguments!: Record<string, unknown>;
}
