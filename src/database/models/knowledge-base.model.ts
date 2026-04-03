/**
 * ============================================================================
 * KNOWLEDGE BASE MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan knowledge base AI.
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

  @AllowNull(false)
  @Column(DataType.STRING)
  keyword!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  question!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  answer!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  updated_at!: Date;
}
