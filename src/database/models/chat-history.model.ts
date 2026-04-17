/**
 * ============================================================================
 * CHAT HISTORY MODEL
 * ============================================================================
 * 
 * Model Sequelize untuk tabel chat_history.
 * Menyimpan history percakapan user dengan bot.
 * 
 * Fields:
 * - id: Primary key
 * - user_id: Foreign key ke users
 * - wa_message_id: ID pesan dari WhatsApp API
 * - reply_wa_message_id: ID pesan yang direply (jika ada)
 * - message: Isi pesan
 * - type: Tipe pesan (text, image, audio, dll)
 * - role: Role pengirim (user, assistant)
 * - status: Status pesan (sent, delivered, read, failed)
 * - json_data: Data JSON tambahan (payload dari webhook)
 * - admin_id: ID admin (jika diambil alih admin)
 * - is_llm_read: Flag apakah pesan dibaca oleh LLM
 * - timestamp: Waktu pesan
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
  ForeignKey,
  BelongsTo,
  Default,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';

/**
 * ============================================================================
 * MESSAGE TYPE ENUM
 * ============================================================================
 */
export enum MessageType {
  TEXT = 'text',
  INTERACTIVE = 'interactive',
  IMAGE = 'image',
  STICKER = 'striker',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  ORDER = 'order',
  TEMPLATE = 'template',
  REACTION = 'reaction',
}

/**
 * ============================================================================
 * MESSAGE ROLE ENUM
 * ============================================================================
 */
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

/**
 * ============================================================================
 * MESSAGE STATUS ENUM
 * ============================================================================
 */
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * ============================================================================
 * CHAT HISTORY MODEL CLASS
 * ============================================================================
 */
@Table({
  tableName: 'chat_history',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class ChatHistory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  /**
   * Foreign key ke table users
   */
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  /**
   * ID pesan dari WhatsApp API
   */
  @Default(null)
  @Column(DataType.STRING)
  wa_message_id!: string | null;

  /**
   * ID pesan yang direply (untuk threaded conversation)
   */
  @Default(null)
  @Column(DataType.STRING)
  reply_wa_message_id!: string | null;

  /**
   * Isi pesan/chat
   */
  @AllowNull(false)
  @Column(DataType.TEXT)
  message!: string;

  /**
   * Tipe pesan (text, image, audio, dll)
   */
  @Default(MessageType.TEXT)
  @Column(DataType.ENUM(...Object.values(MessageType)))
  type!: MessageType;

  /**
   * Role pengirim pesan (user/assistant)
   */
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(MessageRole)))
  role!: MessageRole;

  /**
   * Status pengiriman pesan
   */
  @Default(MessageStatus.SENT)
  @Column(DataType.ENUM(...Object.values(MessageStatus)))
  status!: MessageStatus;

  /**
   * Hasil processing AI (transkripsi audio, deskripsi gambar, OCR KTP, dll)
   * Digunakan untuk LLM context, sedangkan `message` untuk tampilan UI.
   */
  @Default(null)
  @Column(DataType.TEXT)
  processed_content!: string | null;

  /**
   * Data JSON tambahan (payload dari webhook)
   */
  @Default(null)
  @Column(DataType.JSON)
  json_data!: Record<string, unknown> | null;

  /**
   * ID admin jika percakapan diambil alih admin
   */
  @Default(null)
  @Column(DataType.INTEGER)
  admin_id!: number | null;

  /**
   * Flag apakah pesan sudah dibaca oleh LLM
   * 1 = sudah dibaca, 0 = belum dibaca
   */
  @Default(1)
  @Column(DataType.INTEGER)
  is_llm_read!: number;

  /**
   * Timestamp pesan
   */
  @CreatedAt
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  timestamp!: Date;

  // ========================================================================
  // RELATIONSHIPS
  // ========================================================================
  
  /**
   * Many-to-One relationship dengan User
   */
  @BelongsTo(() => User, 'user_id')
  user!: User;
}
