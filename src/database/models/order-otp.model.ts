/**
 * ============================================================================
 * ORDER OTP MODEL
 * ============================================================================
 *
 * Model Sequelize untuk tabel order_otps.
 * Menyimpan kode OTP untuk verifikasi pengambilan pesanan.
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
import { Order } from './order.model';
import { OrderPayment } from './order-payment.model';

/**
 * ============================================================================
 * OTP PURPOSE ENUM
 * ============================================================================
 */
export enum OtpPurpose {
  PICKUP_VERIFICATION = 'pickup_verification',
  ORDER_CONFIRMATION = 'order_confirmation',
}

/**
 * ============================================================================
 * OTP STATUS ENUM
 * ============================================================================
 */
export enum OtpStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
}

/**
 * ============================================================================
 * ORDER OTP MODEL CLASS
 * ============================================================================
 */
@Table({
  tableName: 'order_otps',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Tidak perlu updated_at untuk OTP
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class OrderOtp extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  /**
   * Foreign key ke orders
   */
  @ForeignKey(() => Order)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  order_id!: number;

  /**
   * Foreign key ke users
   */
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  /**
   * Foreign key ke order_payments
   */
  @ForeignKey(() => OrderPayment)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  payment_id!: number;

  /**
   * Kode OTP (6 digit)
   */
  @AllowNull(false)
  @Column(DataType.STRING(10))
  otp_code!: string;

  /**
   * Tujuan OTP
   */
  @Default(OtpPurpose.PICKUP_VERIFICATION)
  @Column(DataType.ENUM(...Object.values(OtpPurpose)))
  purpose!: OtpPurpose;

  /**
   * Status OTP
   */
  @Default(OtpStatus.ACTIVE)
  @Column(DataType.ENUM(...Object.values(OtpStatus)))
  status!: OtpStatus;

  /**
   * Waktu expired OTP
   */
  @AllowNull(false)
  @Column(DataType.DATE)
  expires_at!: Date;

  /**
   * Waktu verifikasi (jika sudah digunakan)
   */
  @Column(DataType.DATE)
  verified_at!: Date | null;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  // ========================================================================
  // RELATIONSHIPS
  // ========================================================================

  /**
   * Many-to-One relationship dengan Order
   */
  @BelongsTo(() => Order, 'order_id')
  order!: Order;

  /**
   * Many-to-One relationship dengan User
   */
  @BelongsTo(() => User, 'user_id')
  user!: User;

  /**
   * Many-to-One relationship dengan OrderPayment
   */
  @BelongsTo(() => OrderPayment, 'payment_id')
  payment!: OrderPayment;

  // ========================================================================
  // INSTANCE METHODS
  // ========================================================================

  /**
   * Check apakah OTP masih valid (belum expired)
   */
  isValid(): boolean {
    if (this.status !== OtpStatus.ACTIVE) {
      return false;
    }
    return new Date() < new Date(this.expires_at);
  }

  /**
   * Mark OTP sebagai used
   */
  async markAsUsed(): Promise<void> {
    this.status = OtpStatus.USED;
    this.verified_at = new Date();
    await this.save();
  }

  /**
   * Mark OTP sebagai expired
   */
  async markAsExpired(): Promise<void> {
    this.status = OtpStatus.EXPIRED;
    await this.save();
  }
}
