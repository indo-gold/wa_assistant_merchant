/**
 * ============================================================================
 * MIGRATION: Add Order Cancellation Fields
 * ============================================================================
 * 
 * Menambahkan kolom untuk tracking order cancellation:
 * - cancelled_at: Timestamp saat order dibatalkan
 * - cancellation_reason: Alasan pembatalan
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
      // 1. Tambah kolom cancelled_at
      await queryInterface.addColumn('order', 'cancelled_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Waktu order dibatalkan (jika status failed/cancelled)',
      }, { transaction });

      // 2. Tambah kolom cancellation_reason
      await queryInterface.addColumn('order', 'cancellation_reason', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
        comment: 'Alasan pembatalan order',
      }, { transaction });

      // 3. Update enum payment_status untuk menambahkan 'cancelled'
      // Note: MySQL tidak support ALTER TYPE, jadi kita perlu ALTER COLUMN
      await queryInterface.changeColumn('order', 'payment_status', {
        type: Sequelize.ENUM('pending', 'paid', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Status pembayaran: pending, paid, failed, cancelled',
      }, { transaction });

      // 4. Tambah index untuk cancelled_at
      await queryInterface.addIndex('order', ['payment_status', 'cancelled_at'], {
        name: 'idx_order_status_cancelled',
        transaction,
      });

      await transaction.commit();
      console.log('✅ Migration completed: Added order cancellation fields');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove index
      await queryInterface.removeIndex('order', 'idx_order_status_cancelled', { transaction });

      // Revert enum ke yang lama (pending, paid, failed)
      await queryInterface.changeColumn('order', 'payment_status', {
        type: Sequelize.ENUM('pending', 'paid', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      }, { transaction });

      // Remove columns
      await queryInterface.removeColumn('order', 'cancelled_at', { transaction });
      await queryInterface.removeColumn('order', 'cancellation_reason', { transaction });

      await transaction.commit();
      console.log('✅ Rollback completed: Removed order cancellation fields');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
