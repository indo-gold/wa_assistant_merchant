/**
 * ============================================================================
 * SAVE MESSAGE DTO
 * ============================================================================
 * 
 * DTO untuk menyimpan pesan ke chat history.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { MessageType, MessageRole } from '../../../database/models';

export class SaveMessageDto {
  @IsNumber()
  @IsNotEmpty()
  user_id!: number;

  @IsString()
  @IsOptional()
  wa_message_id?: string;

  @IsString()
  @IsOptional()
  reply_wa_message_id?: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsEnum(MessageRole)
  @IsNotEmpty()
  role!: MessageRole;

  @IsOptional()
  json_data?: Record<string, unknown>;

  @IsNumber()
  @IsOptional()
  is_llm_read?: number;
}
