/**
 * ============================================================================
 * SURVEY DETAIL MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan detail survey per user.
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
} from 'sequelize-typescript';
import { Survey } from './survey.model';
import { User } from './user.model';

export enum SurveyActivity {
  GENERATE_LINK = 'generate_link',
  OPEN_LINK = 'open_link',
  COMPLETED = 'completed',
}

@Table({
  tableName: 'survey_detail',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class SurveyDetail extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Survey)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  survey_id!: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(SurveyActivity)))
  activity!: SurveyActivity;

  @AllowNull(false)
  @Column(DataType.TEXT)
  unique!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  wa_message_id!: string;

  // Relationships
  @BelongsTo(() => Survey, 'survey_id')
  survey!: Survey;

  @BelongsTo(() => User, 'user_id')
  user!: User;
}
