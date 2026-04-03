/**
 * ============================================================================
 * AGENT AI MODEL
 * ============================================================================
 *
 * Model untuk konfigurasi AI Agent.
 * Menyimpan instruction, model, dan parameters untuk setiap agent.
 *
 * Contoh agent: 'AI Utama', 'Agent Response', 'Agent Cari Pengetahuan', dll
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

import { StudioAI } from './studio-ai.model';

@Table({
  tableName: 'agent_ai',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class AgentAI extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string; // 'AI Utama', 'Agent Response', dll

  @AllowNull(false)
  @Column(DataType.TEXT)
  instruction!: string; // System prompt/instruction

  @AllowNull(false)
  @Column(DataType.STRING)
  model!: string; // Model name: 'gpt-4', 'llama3-70b', dll

  @Default('0')
  @AllowNull(false)
  @Column(DataType.STRING)
  is_used!: string;

  @ForeignKey(() => StudioAI)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  studio_id!: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  hybrid_studio_id!: number | null;

  @Default('')
  @AllowNull(false)
  @Column(DataType.TEXT)
  parameters!: string; // JSON string: { temperature: 0.7, max_tokens: 1000 }

  @Default('')
  @AllowNull(false)
  @Column(DataType.TEXT)
  first_chat!: string; // Pesan pertama untuk new user

  @Column(DataType.DATE)
  timestamp!: Date;

  // Relationships
  @BelongsTo(() => StudioAI, 'studio_id')
  studio!: StudioAI;
}
