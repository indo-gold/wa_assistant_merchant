/**
 * ============================================================================
 * CART MODEL
 * ============================================================================
 * 
 * Model Sequelize untuk tabel cart.
 * Menyimpan data keranjang belanja user.
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
  Default,
  CreatedAt,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';

/**
 * ============================================================================
 * CART STATUS ENUM
 * ============================================================================
 */
export enum CartStatus {
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  APPROVED = 'approved',
}

/**
 * ============================================================================
 * PRODUCT ORDER INTERFACE
 * ============================================================================
 */
export interface ProductOrder {
  product_id: number;
  product_name: string;
  variant_id: number;
  variant_name: string | null;
  quantity: number;
  denomination: number;
  max_quantity: number;
  price: number;
  discount_price: number;
  is_po: number;
  automatic_po: number;
  est_date_po: number;
  stock_po: number;
}

@Table({
  tableName: 'cart',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Cart extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  wa_message_id!: string;

  /**
   * JSON array dari produk yang dipesan
   */
  @AllowNull(false)
  @Column(DataType.JSON)
  json_order!: ProductOrder[];

  @Default(CartStatus.PENDING)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(CartStatus)))
  status_order!: CartStatus;

  @Default(null)
  @Column(DataType.INTEGER)
  follow_up!: number | null;

  @CreatedAt
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  timestamp!: Date;

  // Relationships
  @BelongsTo(() => User, 'user_id')
  user!: User;
}
