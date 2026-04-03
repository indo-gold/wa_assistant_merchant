/**
 * ============================================================================
 * GENERAL VARIABLES MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan variabel konfigurasi umum.
 * Contoh: url_indogold, dll
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
} from 'sequelize-typescript';

@Table({
  tableName: 'general_variables',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class GeneralVariables extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  variable!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  value!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  updated_at!: Date;
}
