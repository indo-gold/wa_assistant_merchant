/**
 * ============================================================================
 * MIGRATION: Add Price Lock & Expiry to Cart
 * ============================================================================
 * 
 * Menambahkan kolom untuk:
 * - Price locking (menyimpan harga saat cart dibuat)
 * - Cart expiry (batas waktu cart)
 * - Price snapshot (snapshot harga asli untuk perbandingan)
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Tambah kolom price_locked_at (timestamp saat harga di-lock)
      await queryInterface.addColumn('cart', 'price_locked_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Timestamp saat harga di-lock untuk checkout',
      }, { transaction });

      // 2. Tambah kolom price_lock_duration_minutes (durasi lock dalam menit)
      await queryInterface.addColumn('cart', 'price_lock_duration_minutes', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
        comment: 'Durasi price lock dalam menit (default: 5 menit)',
      }, { transaction });

      // 3. Tambah kolom expires_at (cart expiry time)
      await queryInterface.addColumn('cart', 'expires_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Waktu expired cart (default: 5 menit dari pembuatan)',
      }, { transaction });

      // 4. Tambah kolom original_prices_snapshot (JSON snapshot harga saat cart dibuat)
      await queryInterface.addColumn('cart', 'original_prices_snapshot', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        comment: 'Snapshot harga produk saat cart dibuat untuk perbandingan',
      }, { transaction });

      // 5. Tambah kolom price_validated_at (timestamp validasi terakhir)
      await queryInterface.addColumn('cart', 'price_validated_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Timestamp terakhir validasi harga berhasil',
      }, { transaction });

      // 6. Tambah index untuk optimasi query cart pending yang expired
      await queryInterface.addIndex('cart', ['status_order', 'expires_at'], {
        name: 'idx_cart_status_expires',
        transaction,
      });

      // 7. Tambah index untuk price lock query
      await queryInterface.addIndex('cart', ['status_order', 'price_locked_at'], {
        name: 'idx_cart_status_price_lock',
        transaction,
      });

      await transaction.commit();
      console.log('✅ Migration completed: Added price lock columns to cart table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove indexes
      await queryInterface.removeIndex('cart', 'idx_cart_status_expires', { transaction });
      await queryInterface.removeIndex('cart', 'idx_cart_status_price_lock', { transaction });

      // Remove columns
      await queryInterface.removeColumn('cart', 'price_locked_at', { transaction });
      await queryInterface.removeColumn('cart', 'price_lock_duration_minutes', { transaction });
      await queryInterface.removeColumn('cart', 'expires_at', { transaction });
      await queryInterface.removeColumn('cart', 'original_prices_snapshot', { transaction });
      await queryInterface.removeColumn('cart', 'price_validated_at', { transaction });

      await transaction.commit();
      console.log('✅ Rollback completed: Removed price lock columns from cart table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
