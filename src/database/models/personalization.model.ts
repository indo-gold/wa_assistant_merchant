/**
 * ============================================================================
 * PERSONALIZATION MODEL
 * ============================================================================
 *
 * Model untuk menyimpan personalisasi user.
 * Menyimpan preferensi komunikasi, identitas, dan catatan penting user.
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
} from 'sequelize-typescript';

@Table({
  tableName: 'personalization',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Personalization extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  user_id!: number;

  @AllowNull(true)
  @Column(DataType.TEXT)
  personality!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(100))
  nickname!: string | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  age!: number | null;

  @AllowNull(true)
  @Column(DataType.STRING(100))
  occupation!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(50))
  language_style!: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  interests!: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  notes!: string | null;

  @AllowNull(true)
  @Column(DataType.JSON)
  reminder!: Record<string, unknown> | null;

  @Default(DataType.NOW)
  @AllowNull(true)
  @Column(DataType.DATE)
  timestamp?: Date;
}
