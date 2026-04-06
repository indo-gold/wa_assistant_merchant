/**
 * ============================================================================
 * PROMO PRODUCT MODEL (Junction Table)
 * ============================================================================
 *
 * Model Sequelize untuk tabel promo_products.
 * Junction table many-to-many antara promos dan products.
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
  ForeignKey,
  AllowNull,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Promo } from './promo.model';
import { Product } from './product.model';

@Table({
  tableName: 'promo_products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class PromoProduct extends Model {
  @ForeignKey(() => Promo)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  promo_id!: number;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  product_id!: number;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date | null;
}
