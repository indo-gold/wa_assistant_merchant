/**
 * ============================================================================
 * MODEL AI MODEL
 * ============================================================================
 *
 * Model untuk informasi AI Model dan pricing.
 * Menyimpan cost per token untuk tracking penggunaan.
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
  tableName: 'model_ai',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class ModelAI extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  model!: string; // 'gpt-4', 'gpt-3.5-turbo', 'llama3-70b', dll

  @ForeignKey(() => StudioAI)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  studio_id!: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  input!: number; // Cost per input token

  @AllowNull(false)
  @Column(DataType.FLOAT)
  output!: number; // Cost per output token

  @Default(0)
  @AllowNull(false)
  @Column(DataType.FLOAT)
  cached!: number; // Cost per cached token

  @Default(1000)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  token_per!: number; // Token base (usually 1000)

  @Default(1)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  status!: number; // 1 = aktif, 0 = tidak aktif

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  rpm!: number;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  rpd!: number;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  tpm!: number;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  tpd!: number;

  // Relationships
  @BelongsTo(() => StudioAI, 'studio_id')
  studio!: StudioAI;
}
