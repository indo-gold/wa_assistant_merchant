/**
 * ============================================================================
 * REMINDER PRODUCTS MODEL
 * ============================================================================
 * 
 * Model untuk menyimpan reminder produk yang diinginkan user.
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
import { User } from './user.model';
import { Product } from './product.model';

@Table({
  tableName: 'reminder_products',
  timestamps: false,
  charset: 'latin1',
  collate: 'latin1_swedish_ci',
})
export class ReminderProducts extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Product)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  product_id?: number;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  product_name!: string;

  @AllowNull(true)
  @Column(DataType.STRING(50))
  variant_name?: string;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  denomination!: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  followup?: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  wa_message_id?: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  created_at?: Date;

  // Relationships
  @BelongsTo(() => User, 'user_id')
  user!: User;

  @BelongsTo(() => Product, 'product_id')
  product?: Product;
}
