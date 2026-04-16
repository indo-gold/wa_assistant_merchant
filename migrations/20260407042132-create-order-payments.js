'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_payments', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "order_id": {
        type: Sequelize.INTEGER,
        comment: "FK ke orders (nullable karena order dibuat setelah payment success)",
      },
      "cart_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "FK ke cart",
      },
      "user_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "FK ke users",
      },
      "xendit_invoice_id": {
        type: Sequelize.STRING(255),
        comment: "ID invoice dari Xendit",
      },
      "xendit_external_id": {
        type: Sequelize.STRING(255),
        comment: "External ID yang kita kirim ke Xendit",
      },
      "payment_method": {
        type: Sequelize.STRING(50),
      },
      "amount": {
        type: Sequelize.DECIMAL(15,2),
        allowNull: false,
        comment: "Total amount",
      },
      "currency": {
        type: Sequelize.STRING(3),
        defaultValue: "IDR",
      },
      "status": {
        type: Sequelize.ENUM('pending','paid','expired','failed','cancelled'),
        defaultValue: "pending",
      },
      "invoice_url": {
        type: Sequelize.TEXT,
        comment: "URL invoice Xendit",
      },
      "payment_details": {
        type: Sequelize.TEXT('long'),
        comment: "Detail pembayaran (VA number, QR string, etc)",
        charset: 'utf8mb4',
        collate: 'utf8mb4_bin',
      },
      "expiry_date": {
        type: Sequelize.DATE,
        comment: "Waktu expired invoice",
      },
      "paid_at": {
        type: Sequelize.DATE,
        comment: "Waktu pembayaran berhasil",
      },
      "xendit_callback_payload": {
        type: Sequelize.TEXT('long'),
        comment: "Raw payload dari Xendit webhook",
        charset: 'utf8mb4',
        collate: 'utf8mb4_bin',
      },
      "created_at": {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "updated_at": {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
      "fee_type": {
        type: Sequelize.ENUM('percent','flat'),
        defaultValue: "percent",
      },
      "platform_fee_amount": {
        type: Sequelize.DECIMAL(15,2),
        allowNull: false,
        defaultValue: "0.00",
      },
      "merchant_amount": {
        type: Sequelize.DECIMAL(15,2),
        allowNull: false,
        defaultValue: "0.00",
      },
      "fee_percent": {
        type: Sequelize.DECIMAL(5,2),
      },
      "fee_flat": {
        type: Sequelize.INTEGER,
      },
    }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addConstraint('order_payments', {
      fields: ["xendit_external_id"],
      type: 'unique',
      name: 'xendit_external_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_payments', ["cart_id"], {
      name: 'cart_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_payments', ["user_id"], {
      name: 'user_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_payments', ["status"], {
      name: 'idx_status'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_payments', ["xendit_invoice_id"], {
      name: 'idx_xendit_invoice'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_payments', ["xendit_external_id"], {
      name: 'idx_external_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_payments', ["expiry_date"], {
      name: 'idx_expiry'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('order_payments', {
      fields: ["cart_id"],
      type: 'foreign key',
      name: 'order_payments_ibfk_1',
      references: {
        table: 'cart',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('order_payments', {
      fields: ["user_id"],
      type: 'foreign key',
      name: 'order_payments_ibfk_2',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('order_payments', 'order_payments_ibfk_1');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('order_payments', 'order_payments_ibfk_2');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('order_payments', 'xendit_external_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_payments', 'cart_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_payments', 'user_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_payments', 'idx_status');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_payments', 'idx_xendit_invoice');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_payments', 'idx_external_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_payments', 'idx_expiry');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('order_payments');
  }
};
