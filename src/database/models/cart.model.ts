/**
 * ============================================================================
 * CART MODEL
 * ============================================================================
 *
 * Model Sequelize untuk tabel cart.
 * Menyimpan data keranjang belanja user.
 *
 * Features:
 * - Price locking: Menyimpan harga saat cart dibuat dengan batas waktu
 * - Cart expiry: Cart otomatis expired setelah 24 jam
 * - Price snapshot: Snapshot harga untuk deteksi perubahan
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
  EXPIRED = 'expired',
}

/**
 * ============================================================================
 * PRODUCT ORDER INTERFACE
 * ============================================================================
 */
export interface ProductOrder {
  product_id: number;
  product_name: string;
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

/**
 * ============================================================================
 * PRICE SNAPSHOT INTERFACE
 * ============================================================================
 * Menyimpan snapshot harga produk saat cart dibuat
 */
export interface PriceSnapshot {
  product_id: number;
  product_name: string;
  price_at_creation: number;
  price_current: number;
  timestamp: string;
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

  // ========================================================================
  // PRICE LOCK & EXPIRY FIELDS (NEW)
  // ========================================================================

  /**
   * Timestamp saat harga di-lock untuk checkout
   * Set saat user melihat rincian pesanan
   */
  @Default(null)
  @Column(DataType.DATE)
  price_locked_at!: Date | null;

  /**
   * Durasi price lock dalam menit
   * Default: 5 menit (harga di-lock saat user melihat rincian)
   */
  @Default(5)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  price_lock_duration_minutes!: number;

  /**
   * Waktu expired cart (default: 5 menit dari pembuatan)
   * Cart akan otomatis cancelled setelah waktu ini
   */
  @Default(null)
  @Column(DataType.DATE)
  expires_at!: Date | null;

  /**
   * Snapshot harga produk saat cart dibuat
   * Digunakan untuk deteksi perubahan harga
   */
  @Default(null)
  @Column(DataType.JSON)
  original_prices_snapshot!: PriceSnapshot[] | null;

  /**
   * Timestamp terakhir validasi harga berhasil
   */
  @Default(null)
  @Column(DataType.DATE)
  price_validated_at!: Date | null;

  // Relationships
  @BelongsTo(() => User, 'user_id')
  user!: User;

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Cek apakah price lock masih berlaku
   */
  isPriceLockValid(): boolean {
    if (!this.price_locked_at) return false;

    const lockExpiry = new Date(
      this.price_locked_at.getTime() + this.price_lock_duration_minutes * 60 * 1000,
    );
    return new Date() <= lockExpiry;
  }

  /**
   * Cek apakah cart sudah expired
   */
  isExpired(): boolean {
    if (!this.expires_at) return false;
    return new Date() > this.expires_at;
  }

  /**
   * Get sisa waktu price lock dalam menit
   */
  getRemainingLockMinutes(): number {
    if (!this.price_locked_at) return 0;

    const lockExpiry = new Date(
      this.price_locked_at.getTime() + this.price_lock_duration_minutes * 60 * 1000,
    );
    const remainingMs = lockExpiry.getTime() - Date.now();
    return Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
  }

  /**
   * Get sisa waktu cart expiry dalam menit
   */
  getRemainingMinutes(): number {
    if (!this.expires_at) return 0;

    const remainingMs = this.expires_at.getTime() - Date.now();
    return Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
  }
}
