/**
 * ============================================================================
 * PRODUCT MODEL
 * ============================================================================
 *
 * Model Sequelize untuk tabel products.
 * Menyimpan informasi produk emas/perak.
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
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';

import { ReminderProducts } from './reminder-products.model';
import { ProductsHistory } from './products-history.model';
import { PromoProduct } from './promo-product.model';
import { Promo } from './promo.model';

@Table({
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'latin1',
  collate: 'latin1_swedish_ci',
})
export class Product extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  product_name!: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  variant_name!: string;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  denomination!: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  price!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  max_quantity!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  products_sold!: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  discount_price!: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  image!: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  is_po!: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  automatic_po!: boolean;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  est_date_po!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  stock_po!: number;

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;

  // Relationships
  @HasMany(() => ReminderProducts, 'product_id')
  reminderProducts!: ReminderProducts[];

  @HasMany(() => ProductsHistory, 'product_id')
  productsHistory!: ProductsHistory[];

  @BelongsToMany(() => Promo, () => PromoProduct)
  promos!: Promo[];
}
