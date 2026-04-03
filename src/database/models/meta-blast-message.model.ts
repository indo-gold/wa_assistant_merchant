/**
 * ============================================================================
 * META BLAST MESSAGE MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan blast message campaigns.
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

export enum BlastMessageStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum BlastProcessingStatus {
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  PAUSED = 'paused',
}

@Table({
  tableName: 'meta_blast_message',
  timestamps: false,
  charset: 'latin1',
  collate: 'latin1_swedish_ci',
})
export class MetaBlastMessage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  title!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  template_id!: number;

  @Default(BlastMessageStatus.INACTIVE)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(BlastMessageStatus)))
  status!: BlastMessageStatus;

  @AllowNull(true)
  @Column(DataType.DATE)
  execute_date?: Date;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.TINYINT)
  is_send_now!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  upload_recipients_id!: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  upload_path!: string;

  @Default(0)
  @AllowNull(true)
  @Column(DataType.TINYINT)
  recipients_loaded?: number;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  total_recipients!: number;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  sent_count!: number;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  delivered_count!: number;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  read_count!: number;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  failed_count!: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  last_activity_at?: Date;

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  created_at!: Date;

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  updated_at!: Date;

  @Default(BlastProcessingStatus.SCHEDULED)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(BlastProcessingStatus)))
  processing_status!: BlastProcessingStatus;
}
