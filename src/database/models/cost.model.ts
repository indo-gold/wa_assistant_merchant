/**
 * ============================================================================
 * COST MODEL
 * ============================================================================
 * 
 * Model untuk tracking cost penggunaan AI.
 * Menyimpan informasi token usage dan estimated cost per request.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';
import { ModelAI } from './model-ai.model';

@Table({
  tableName: 'cost',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Cost extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  object!: string; // 'chat.completion'

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  user_id!: number | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  created!: number | null; // Unix timestamp

  @AllowNull(false)
  @Column(DataType.STRING)
  model!: string; // Model name used

  @AllowNull(false)
  @Column(DataType.INTEGER)
  prompt_tokens!: number;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  cached_tokens!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  completion_tokens!: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  estimate_cost!: number; // Total cost in USD

  @Default(0)
  @AllowNull(false)
  @Column(DataType.FLOAT)
  execution_time!: number; // Response time in ms

  @Default(null)
  @AllowNull(true)
  @Column(DataType.TEXT)
  messages_payload!: string | null; // Request payload for debugging

  @Default(null)
  @AllowNull(true)
  @Column(DataType.JSON)
  json_data!: Record<string, unknown> | null; // Full API response

  @Default(null)
  @AllowNull(true)
  @Column(DataType.STRING)
  wa_message_id!: string | null;

  @ForeignKey(() => ModelAI)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  model_ai_id!: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  agent_id!: number | null;

  @Default(DataType.NOW)
  @AllowNull(true)
  @Column(DataType.DATE)
  timestamp?: Date;

  // Relationships
  @BelongsTo(() => User, 'user_id')
  user!: User;

  @BelongsTo(() => ModelAI, 'model_ai_id')
  modelInfo!: ModelAI;
}
