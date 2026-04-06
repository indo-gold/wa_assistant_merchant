/**
 * ============================================================================
 * PROMO MODEL
 * ============================================================================
 *
 * Model Sequelize untuk tabel promos.
 * Menyimpan data promo/diskon yang bisa berlaku untuk satu atau lebih produk.
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
  CreatedAt,
  UpdatedAt,
  BelongsToMany,
} from 'sequelize-typescript';

import { PromoProduct } from './promo-product.model';
import { Product } from './product.model';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

@Table({
  tableName: 'promos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Promo extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  name!: string;

  @Default('')
  @Column(DataType.TEXT)
  description!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(DiscountType)))
  discount_type!: DiscountType;

  @Default(0)
  @Column(DataType.DECIMAL(15, 2))
  discount_value!: number;

  @Default(0)
  @Column(DataType.DECIMAL(15, 2))
  min_purchase_amount!: number;

  @Default(null)
  @Column(DataType.DECIMAL(15, 2))
  max_discount_amount!: number | null;

  @AllowNull(false)
  @Column(DataType.DATE)
  start_date!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  end_date!: Date;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  applies_to_all_products!: boolean;

  @Default(null)
  @Column(DataType.INTEGER)
  usage_limit!: number | null;

  @Default(null)
  @Column(DataType.INTEGER)
  max_usage_per_user!: number | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_single_product_promo!: boolean;

  @Default(null)
  @Column(DataType.STRING(500))
  banner_image!: string | null;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date | null;

  // =======================================================================
  // RELATIONSHIPS
  // =======================================================================
  @BelongsToMany(() => Product, () => PromoProduct)
  products!: Product[];
}
