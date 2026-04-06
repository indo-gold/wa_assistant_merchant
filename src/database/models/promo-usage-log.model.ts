/**
 * ============================================================================
 * PROMO USAGE LOG MODEL
 * ============================================================================
 *
 * Model Sequelize untuk tabel promo_usage_logs.
 * Tracking penggunaan promo oleh user untuk mencegah abuse
 * dan generate laporan efektivitas promo.
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
  CreatedAt,
  BelongsTo,
} from 'sequelize-typescript';
import { Promo } from './promo.model';
import { User } from './user.model';
import { Order } from './order.model';

@Table({
  tableName: 'promo_usage_logs',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class PromoUsageLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Promo)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  promo_id!: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  @ForeignKey(() => Order)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  order_id!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 2))
  discount_amount!: number;

  @CreatedAt
  @Column(DataType.DATE)
  used_at!: Date;

  // =======================================================================
  // RELATIONSHIPS
  // =======================================================================
  @BelongsTo(() => Promo, 'promo_id')
  promo!: Promo;

  @BelongsTo(() => User, 'user_id')
  user!: User;

  @BelongsTo(() => Order, 'order_id')
  order!: Order;
}
