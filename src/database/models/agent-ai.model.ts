/**
 * ============================================================================
 * AGENT AI MODEL
 * ============================================================================
 *
 * Model untuk konfigurasi AI Agent.
 * Menyimpan instruction, model reference, dan parameters untuk setiap agent.
 *
 * Contoh agent: 'AI Utama', 'Agent Response', 'Agent Cari Pengetahuan', dll
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Default, ForeignKey, BelongsTo, } from 'sequelize-typescript';

import { StudioAI } from './studio-ai.model';
import { ModelAI } from './model-ai.model';


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

  @ForeignKey(() => ModelAI)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  model_id!: number; // Reference to model_ai.id (main model)

  @ForeignKey(() => ModelAI)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  hybrid_model_id!: number | null; // Reference to model_ai.id (hybrid fallback)

  @Default('0')
  @AllowNull(false)
  @Column(DataType.STRING)
  is_used!: string;

  @ForeignKey(() => StudioAI)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  studio_id!: number;

  @Default('')
  @AllowNull(false)
  @Column(DataType.TEXT)
  parameters!: string; // JSON string: { temperature: 0.7, max_tokens: 1000 }

  @Column(DataType.DATE)
  timestamp!: Date;

  // Relationships
  @BelongsTo(() => StudioAI, 'studio_id')
  studio!: StudioAI;

  @BelongsTo(() => ModelAI, 'model_id')
  mainModel!: ModelAI;

  @BelongsTo(() => ModelAI, 'hybrid_model_id')
  hybridModel!: ModelAI | null;
}
