/**
 * ============================================================================
 * CHAT USER COMPLAIN MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan komplain dari user.
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

export enum ComplainCategory {
  LINK = 'link',
  IMAGE = 'image',
  AI_ASSISTANT_INTELLIGENCE = 'ai assistant intelligence',
  PRODUCT = 'product',
  RESPONSE_SPEED = 'response speed',
  LANGUAGE_STYLE = 'language style',
  OTHER = 'other',
}

@Table({
  tableName: 'chat_user_complain',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class ChatUserComplain extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  wa_message_id!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(ComplainCategory)))
  issue_category!: ComplainCategory;

  @Default(DataType.NOW)
  @AllowNull(true)
  @Column(DataType.DATE)
  timestamp?: Date;
}
