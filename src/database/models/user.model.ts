/**
 * ============================================================================
 * USER MODEL
 * ============================================================================
 * 
 * Model Sequelize untuk tabel users.
 * Menyimpan informasi user/pelanggan WhatsApp.
 * 
 * Fields:
 * - id: Primary key (auto increment)
 * - name: Nama user
 * - phone_number: Nomor WA user (unique)
 * - status: Status user (active, block, silent_bot)
 * - timestamp: Waktu pembuatan record
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
  Unique,
  Default,
  HasMany,
  CreatedAt,
} from 'sequelize-typescript';
import { ChatHistory } from './chat-history.model';
import { ReminderProducts } from './reminder-products.model';
import { UserPenalty } from './user-penalty.model';
import { UserNeedHelp } from './user-need-help.model';
import { ChatUserComplain } from './chat-user-complain.model';
import { Cost } from './cost.model';
import { Personalization } from './personalization.model';
import { KtpVerification } from './ktp-verification.model';

/**
 * ============================================================================
 * USER STATUS ENUM
 * ============================================================================
 */
export enum UserStatus {
  ACTIVE = 'active',
  BLOCK = 'block',
  SILENT_BOT = 'silent_bot',
}

/**
 * ============================================================================
 * USER MODEL CLASS
 * ============================================================================
 */
@Table({
  tableName: 'users',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class User extends Model {
  /**
   * Primary key - Auto increment integer
   */
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  /**
   * Nama user/pelanggan
   */
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  /**
   * Nomor telepon WhatsApp user (unique)
   */
  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  phone_number!: string;

  /**
   * Status user:
   * - active: User aktif, bot merespon
   * - block: User di-block, tidak bisa menggunakan layanan
   * - silent_bot: Bot tidak merespon (untuk admin take over)
   */
  @AllowNull(false)
  @Default(UserStatus.ACTIVE)
  @Column(DataType.ENUM(...Object.values(UserStatus)))
  status!: UserStatus;

  /**
   * Pin status user
   */
  @AllowNull(false)
  @Default('inactive')
  @Column(DataType.ENUM('active', 'inactive'))
  pin!: 'active' | 'inactive';

  /**
   * Timestamp pembuatan record
   */
  @CreatedAt
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  timestamp!: Date;

  // ========================================================================
  // RELATIONSHIPS
  // ========================================================================
  
  /**
   * One-to-Many relationship dengan ChatHistory
   */
  @HasMany(() => ChatHistory, 'user_id')
  chatHistories!: ChatHistory[];

  /**
   * One-to-Many relationship dengan ReminderProducts
   */
  @HasMany(() => ReminderProducts, 'user_id')
  reminderProducts!: ReminderProducts[];

  /**
   * One-to-Many relationship dengan UserPenalty
   */
  @HasMany(() => UserPenalty, 'user_id')
  penalties!: UserPenalty[];

  /**
   * One-to-Many relationship dengan UserNeedHelp
   */
  @HasMany(() => UserNeedHelp, 'user_id')
  needHelpSessions!: UserNeedHelp[];

  /**
   * One-to-Many relationship dengan ChatUserComplain
   */
  @HasMany(() => ChatUserComplain, 'user_id')
  complains!: ChatUserComplain[];

  /**
   * One-to-Many relationship dengan Cost
   */
  @HasMany(() => Cost, 'user_id')
  costs!: Cost[];

  /**
   * One-to-Many relationship dengan Personalization
   */
  @HasMany(() => Personalization, 'user_id')
  personalizations!: Personalization[];

  /**
   * One-to-Many relationship dengan KtpVerification
   */
  @HasMany(() => KtpVerification, 'user_id')
  ktpVerifications!: KtpVerification[];
}
