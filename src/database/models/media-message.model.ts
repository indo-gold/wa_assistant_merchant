/**
 * ============================================================================
 * MEDIA MESSAGE MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan media files yang diupload/download.
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
  tableName: 'media_message',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class MediaMessage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  wa_message_id?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  file_name?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  original_name?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  url?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  caption?: string;

  @Default(DataType.NOW)
  @AllowNull(true)
  @Column(DataType.DATE)
  timestamp?: Date;
}
