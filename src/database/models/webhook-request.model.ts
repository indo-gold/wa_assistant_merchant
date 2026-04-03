/**
 * ============================================================================
 * WEBHOOK REQUEST MODEL
 * ============================================================================
 * 
 * Model untuk tracking webhook requests (nonce validation).
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
  tableName: 'webhook_request',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class WebhookRequest extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(true)
  @Column(DataType.STRING(100))
  nonce?: string;

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  timestamp!: Date;
}
