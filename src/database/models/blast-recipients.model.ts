/**
 * ============================================================================
 * BLAST RECIPIENTS MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan recipients blast messages.
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
import { MetaBlastMessage } from './meta-blast-message.model';

export enum RecipientStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Table({
  tableName: 'blast_recipients',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  indexes: [
    { unique: true, fields: ['blast_id', 'phone'], name: 'uq_blast_phone' },
    { fields: ['blast_id', 'status', 'next_attempt_at'], name: 'idx_status_next' },
    { fields: ['blast_id', 'status', 'locked_at'], name: 'idx_locked' },
  ],
})
export class BlastRecipients extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT.UNSIGNED)
  id!: number;

  @ForeignKey(() => MetaBlastMessage)
  @AllowNull(false)
  @Column(DataType.BIGINT.UNSIGNED)
  blast_id!: number;

  @AllowNull(false)
  @Column(DataType.STRING(32))
  phone!: string;

  @Default(RecipientStatus.PENDING)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(RecipientStatus)))
  status!: RecipientStatus;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  retry_count!: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  next_attempt_at?: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  locked_at?: Date;

  @AllowNull(true)
  @Column(DataType.STRING(64))
  worker_id?: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  last_error?: string;

  @AllowNull(true)
  @Column(DataType.STRING(128))
  wa_message_id?: string;

  @AllowNull(false)
  @Column(DataType.TEXT('long'))
  template_send!: string;

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  created_at!: Date;

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  updated_at!: Date;

  // Relationships
  @BelongsTo(() => MetaBlastMessage, 'blast_id')
  blastMessage!: MetaBlastMessage;
}
