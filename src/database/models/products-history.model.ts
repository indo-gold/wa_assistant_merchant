/**
 * ============================================================================
 * PRODUCTS HISTORY MODEL
 * ============================================================================
 *
 * Model untuk menyimpan histori harga produk.
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
} from 'sequelize-typescript';

@Table({
  tableName: 'products_history',
  timestamps: false,
  charset: 'latin1',
  collate: 'latin1_swedish_ci',
})
export class ProductsHistory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  product_id!: number;

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

  @AllowNull(true)
  @Column(DataType.DATE)
  created_at?: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  updated_at?: Date;
}
