/**
 * ============================================================================
 * SURVEY MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan survey yang aktif.
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

export enum SurveyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Table({
  tableName: 'survey',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Survey extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  slug!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  title!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  text!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  time!: number;

  @Default(SurveyStatus.INACTIVE)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(SurveyStatus)))
  status!: SurveyStatus;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  delete!: number;

  @Default(DataType.NOW)
  @AllowNull(true)
  @Column(DataType.DATE)
  update_at?: Date;
}
