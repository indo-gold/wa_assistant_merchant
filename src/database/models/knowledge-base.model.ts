/**
 * ============================================================================
 * KNOWLEDGE BASE MODEL
 * ============================================================================
 *
 * Model untuk menyimpan knowledge base AI.
 *
 * @author IndoGold Team
 * @version 1.1.0
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

@Table({
  tableName: 'knowledge_base',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class KnowledgeBase extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  title!: string | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  category_id!: number | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  question!: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  answer!: string | null;

  @Default('active')
  @Column(DataType.ENUM('active', 'inactive'))
  status!: 'active' | 'inactive';

  @AllowNull(true)
  @Column(DataType.INTEGER)
  modified_by!: number | null;

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  views!: number;

  @Default(0)
  @Column(DataType.TINYINT)
  is_default!: number;
}
