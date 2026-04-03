/**
 * ============================================================================
 * USER NEED HELP MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan user yang membutuhkan bantuan CS.
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

export enum HelpSessionStatus {
  WAITING = 'waiting',
  CHATTING = 'chatting',
  CLOSED = 'closed',
}

@Table({
  tableName: 'user_need_help',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class UserNeedHelp extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  @AllowNull(true)
  @Column(DataType.TEXT)
  topic!: string | null;

  @Default(HelpSessionStatus.WAITING)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(HelpSessionStatus)))
  session_status!: HelpSessionStatus;

  @AllowNull(true)
  @Column(DataType.TEXT)
  remarks!: string | null;

  @Default(DataType.NOW)
  @AllowNull(true)
  @Column(DataType.DATE)
  timestamp?: Date;
}
