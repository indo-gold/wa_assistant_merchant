/**
 * ============================================================================
 * ERROR LOG MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan error logs aplikasi.
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
  tableName: 'error_log',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class ErrorLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(true)
  @Column(DataType.TEXT('long'))
  error?: string;

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  timestamp!: Date;
}
