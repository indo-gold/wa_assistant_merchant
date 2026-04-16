'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cart', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "user_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "wa_message_id": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "json_order": {
        type: Sequelize.TEXT('long'),
        allowNull: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_bin',
      },
      "status_order": {
        type: Sequelize.ENUM('pending','cancelled','approved'),
        allowNull: false,
        defaultValue: "pending",
      },
      "follow_up": {
        type: Sequelize.DATE,
      },
      "timestamp": {
        type: Sequelize.DATE,
      },
      "price_locked_at": {
        type: Sequelize.DATE,
        comment: "Timestamp saat harga di-lock untuk checkout",
      },
      "price_lock_duration_minutes": {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
        comment: "Durasi price lock dalam menit (default: 30 menit)",
      },
      "expires_at": {
        type: Sequelize.DATE,
        comment: "Waktu expired cart (default: 24 jam dari pembuatan)",
      },
      "original_prices_snapshot": {
        type: Sequelize.TEXT('long'),
        comment: "Snapshot harga produk saat cart dibuat untuk perbandingan",
        charset: 'utf8mb4',
        collate: 'utf8mb4_bin',
      },
      "price_validated_at": {
        type: Sequelize.DATE,
        comment: "Timestamp terakhir validasi harga berhasil",
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('cart', ["user_id"], {
        name: 'user_id'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('cart', ["status_order", "expires_at"], {
        name: 'idx_cart_status_expires'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('cart', ["status_order", "price_locked_at"], {
        name: 'idx_cart_status_price_lock'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('cart', {
        fields: ["user_id"],
        type: 'foreign key',
        name: 'cart_ibfk_1',
        references: {
          table: 'users',
          field: 'id'
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('cart', 'cart_ibfk_1');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('cart', 'idx_cart_status_price_lock');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('cart', 'idx_cart_status_expires');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('cart', 'user_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('cart');
  }
};
