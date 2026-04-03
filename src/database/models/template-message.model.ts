/**
 * ============================================================================
 * TEMPLATE MESSAGE MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan WhatsApp message templates.
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

export enum TemplateCategory {
  MARKETING = 'marketing',
  UTILITY = 'utility',
  AUTHENTICATION = 'authentication',
}

export enum TemplateStatus {
  PENDING = 'pending',
  REJECTED = 'rejected',
  APPROVED = 'approved',
}

@Table({
  tableName: 'meta_templates_message',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class TemplateMessage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  template_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  template_name!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TemplateCategory)))
  category!: TemplateCategory;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TemplateStatus)))
  status!: TemplateStatus;

  @AllowNull(false)
  @Column(DataType.TEXT('long'))
  json!: string;

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  created_at!: Date;
}
