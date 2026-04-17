/**
 * ============================================================================
 * ORDER MODEL
 * ============================================================================
 *
 * Model Sequelize untuk tabel order.
 * Menyimpan data order/pesanan yang sudah dibuat invoice.
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
  UpdatedAt,
  BelongsTo,
  HasOne,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Cart } from './cart.model';
import { OrderPayment } from './order-payment.model';
import { OrderOtp } from './order-otp.model';

/**
 * ============================================================================
 * ORDER STATUS ENUM
 * ============================================================================
 */
export enum OrderStatus {
  GENERATE_LINK = 'generate link',
  OPEN_LINK = 'open link',
  LOGIN = 'login',
  ORDER_CONFIRMED = 'order confirmed',
  PENDING = 'pending',
  CANCEL = 'cancel',
  APPROVED = 'approved',
}

/**
 * ============================================================================
 * PICKUP STATUS ENUM
 * ============================================================================
 */
export enum PickupStatus {
  PENDING = 'pending',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  CANCELLED = 'cancelled',
}

@Table({
  tableName: 'order',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Order extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Default(null)
  @Column(DataType.STRING)
  wa_message_id!: string | null;

  @ForeignKey(() => Cart)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  cart_id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  link_invoice!: string;

  // STATUS COLUMN REMOVED - menggunakan payment_status
  // @Default(OrderStatus.GENERATE_LINK)
  // @AllowNull(false)
  // @Column(DataType.ENUM(...Object.values(OrderStatus)))
  // status!: OrderStatus;

  @Column(DataType.DATE)
  follow_up!: Date | null;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  // ==========================================================================
  // PAYMENT & PICKUP FIELDS (NEW)
  // ==========================================================================

  /**
   * Foreign key ke order_payments
   */
  @ForeignKey(() => OrderPayment)
  @Column(DataType.INTEGER)
  payment_id!: number | null;

  /**
   * Status pembayaran
   * - pending: Menunggu pembayaran
   * - paid: Sudah dibayar
   * - expired: Timeout pembayaran
   * - failed: Gagal
   * - cancelled: Dibatalkan
   */
  @Default('pending')
  @Column(DataType.ENUM('pending', 'paid', 'expired', 'failed', 'cancelled'))
  payment_status!: 'pending' | 'paid' | 'expired' | 'failed' | 'cancelled';

  /**
   * Status apakah OTP sudah diverifikasi
   */
  @Default(false)
  @Column(DataType.BOOLEAN)
  otp_verified!: boolean;

  /**
   * Status pengambilan pesanan
   */
  @Default(PickupStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(PickupStatus)))
  pickup_status!: PickupStatus;

  /**
   * Waktu pengambilan pesanan
   */
  @Column(DataType.DATE)
  picked_up_at!: Date | null;

  /**
   * Waktu order dibatalkan (jika status failed/cancelled)
   */
  @Default(null)
  @Column(DataType.DATE)
  cancelled_at!: Date | null;

  /**
   * Alasan pembatalan
   */
  @Default(null)
  @Column(DataType.STRING)
  cancellation_reason!: string | null;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date | null;

  // ========================================================================
  // RELATIONSHIPS
  // ========================================================================

  @BelongsTo(() => User, 'user_id')
  user!: User;

  @BelongsTo(() => Cart, 'cart_id')
  cart!: Cart;

  /**
   * Many-to-One relationship dengan OrderPayment
   */
  @BelongsTo(() => OrderPayment, 'payment_id')
  payment!: OrderPayment | null;

  /**
   * One-to-One relationship dengan OrderOtp
   */
  @HasOne(() => OrderOtp, 'order_id')
  orderOtp!: OrderOtp | null;
}
