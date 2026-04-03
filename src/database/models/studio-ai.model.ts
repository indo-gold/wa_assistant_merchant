/**
 * ============================================================================
 * STUDIO AI MODEL
 * ============================================================================
 *
 * Model untuk konfigurasi AI Studio/Provider.
 * Menyimpan konfigurasi untuk provider AI (OpenAI, Groq, dll).
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
  HasMany,
} from 'sequelize-typescript';

import { AgentAI } from './agent-ai.model';

export enum StudioStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Table({
  tableName: 'studio_ai',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class StudioAI extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  studio!: string; // 'OpenAI', 'Groq', 'Deepseek', dll

  @Default(StudioStatus.INACTIVE)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(StudioStatus)))
  is_active!: StudioStatus;

  @Default('0')
  @AllowNull(false)
  @Column(DataType.STRING)
  is_used!: string; // '1' = active, '0' = inactive

  // Relationships
  @HasMany(() => AgentAI, 'studio_id')
  agents!: AgentAI[];
}
