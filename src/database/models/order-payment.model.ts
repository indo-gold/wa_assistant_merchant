/**
 * ============================================================================
 * ORDER PAYMENT MODEL
 * ============================================================================
 *
 * Model Sequelize untuk tabel order_payments.
 * Menyimpan data invoice pembayaran dari Xendit.
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
import { Order } from './order.model';
import { OrderOtp } from './order-otp.model';

/**
 * ============================================================================
 * PAYMENT METHOD ENUM
 * ============================================================================
 */
export enum PaymentMethodType {
  VIRTUAL_ACCOUNT = 'virtual_account',
  EWALLET = 'ewallet',
  QRIS = 'qris',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
}

/**
 * ============================================================================
 * PAYMENT STATUS ENUM
 * ============================================================================
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  EXPIRED = 'expired',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * ============================================================================
 * FEE TYPE ENUM
 * ============================================================================
 */
export enum FeeType {
  PERCENT = 'percent',
  FLAT = 'flat',
}

/**
 * ============================================================================
 * ORDER PAYMENT MODEL CLASS
 * ============================================================================
 */
@Table({
  tableName: 'order_payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class OrderPayment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  /**
   * Foreign key ke orders (nullable karena order dibuat setelah payment success)
   */
  @ForeignKey(() => Order)
  @Column(DataType.INTEGER)
  order_id!: number | null;

  /**
   * Foreign key ke cart
   */
  @ForeignKey(() => Cart)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  cart_id!: number;

  /**
   * Foreign key ke users
   */
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  /**
   * Payment method type
   */
  @Column(DataType.ENUM(...Object.values(PaymentMethodType)))
  payment_method!: PaymentMethodType | null;

  /**
   * ID invoice dari Xendit
   */
  @Column(DataType.STRING(255))
  xendit_invoice_id!: string | null;

  /**
   * External ID yang kita kirim ke Xendit
   */
  @Column(DataType.STRING(255))
  xendit_external_id!: string | null;

  /**
   * Total amount pembayaran
   */
  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 2))
  amount!: number;

  /**
   * Currency (default IDR)
   */
  @Default('IDR')
  @Column(DataType.STRING(3))
  currency!: string;

  /**
   * Status pembayaran
   */
  @Default(PaymentStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(PaymentStatus)))
  status!: PaymentStatus;

  /**
   * URL invoice Xendit
   */
  @Column(DataType.TEXT)
  invoice_url!: string | null;

  /**
   * Detail pembayaran (VA number, QR string, etc)
   */
  @Column(DataType.JSON)
  payment_details!: Record<string, unknown> | null;

  /**
   * Waktu expired invoice
   */
  @Column(DataType.DATE)
  expiry_date!: Date | null;

  /**
   * Waktu pembayaran berhasil
   */
  @Column(DataType.DATE)
  paid_at!: Date | null;

  /**
   * Raw payload dari Xendit webhook
   */
  @Column(DataType.JSON)
  xendit_callback_payload!: Record<string, unknown> | null;

  /**
   * Tipe platform fee (percent/flat)
   */
  @Default(FeeType.PERCENT)
  @Column(DataType.ENUM(...Object.values(FeeType)))
  fee_type!: FeeType;

  /**
   * Jumlah platform fee yang di-charge
   */
  @Default(0)
  @Column(DataType.DECIMAL(15, 2))
  platform_fee_amount!: number;

  /**
   * Jumlah yang diterima merchant (setelah dipotong fee)
   */
  @Default(0)
  @Column(DataType.DECIMAL(15, 2))
  merchant_amount!: number;

  /**
   * Persentase fee (untuk history)
   */
  @Column(DataType.DECIMAL(5, 2))
  fee_percent!: number | null;

  /**
   * Flat fee amount (untuk history)
   */
  @Column(DataType.INTEGER)
  fee_flat!: number | null;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;

  // ========================================================================
  // RELATIONSHIPS
  // ========================================================================

  /**
   * Many-to-One relationship dengan Order
   */
  @BelongsTo(() => Order, 'order_id')
  order!: Order | null;

  /**
   * Many-to-One relationship dengan Cart
   */
  @BelongsTo(() => Cart, 'cart_id')
  cart!: Cart;

  /**
   * Many-to-One relationship dengan User
   */
  @BelongsTo(() => User, 'user_id')
  user!: User;

  /**
   * One-to-One relationship dengan OrderOtp
   */
  @HasOne(() => OrderOtp, 'payment_id')
  orderOtp!: OrderOtp | null;
}
