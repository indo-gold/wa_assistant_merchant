/**
 * ============================================================================
 * USER PENALTY MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan penalty user (spam protection).
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

export enum PenaltyStatus {
  RUNNING = 'running',
  END = 'end',
}

@Table({
  tableName: 'user_penalty',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class UserPenalty extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  penalty_until!: Date;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(PenaltyStatus)))
  status!: PenaltyStatus;

  @AllowNull(false)
  @Column(DataType.DATE)
  timestamp!: Date;
}
