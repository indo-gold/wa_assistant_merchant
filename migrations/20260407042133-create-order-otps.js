'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_otps', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "order_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "user_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "payment_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "otp_code": {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      "purpose": {
        type: Sequelize.ENUM('pickup_verification','order_confirmation'),
        defaultValue: "pickup_verification",
      },
      "status": {
        type: Sequelize.ENUM('active','used','expired'),
        defaultValue: "active",
      },
      "expires_at": {
        type: Sequelize.DATE,
        allowNull: false,
      },
      "verified_at": {
        type: Sequelize.DATE,
      },
      "created_at": {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    }, {
    charset: 'utf8mb4',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('order_otps', ["user_id"], {
      name: 'user_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_otps', ["payment_id"], {
      name: 'payment_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_otps', ["otp_code"], {
      name: 'idx_otp_code'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_otps', ["status"], {
      name: 'idx_status'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_otps', ["expires_at"], {
      name: 'idx_expires'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('order_otps', ["order_id"], {
      name: 'order_otps_ibfk_1'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('order_otps', {
      fields: ["order_id"],
      type: 'foreign key',
      name: 'order_otps_ibfk_1',
      references: {
        table: 'order',
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
      await queryInterface.addConstraint('order_otps', {
      fields: ["user_id"],
      type: 'foreign key',
      name: 'order_otps_ibfk_2',
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
    try {
      await queryInterface.addConstraint('order_otps', {
      fields: ["payment_id"],
      type: 'foreign key',
      name: 'order_otps_ibfk_3',
      references: {
        table: 'order_payments',
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
      await queryInterface.removeConstraint('order_otps', 'order_otps_ibfk_1');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('order_otps', 'order_otps_ibfk_2');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('order_otps', 'order_otps_ibfk_3');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_otps', 'user_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_otps', 'payment_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_otps', 'idx_otp_code');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_otps', 'idx_status');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_otps', 'idx_expires');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_otps', 'order_otps_ibfk_1');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('order_otps');
  }
};
