'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "cart_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "wa_message_id": {
        type: Sequelize.STRING(255),
      },
      "link_invoice": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "follow_up": {
        type: Sequelize.DATE,
      },
      "user_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "payment_status": {
        type: Sequelize.ENUM('pending','paid','failed'),
        allowNull: false,
        defaultValue: "pending",
        comment: "Status pembayaran: pending, paid, failed",
      },
      "payment_id": {
        type: Sequelize.INTEGER,
      },
      "otp_verified": {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
      },
      "pickup_status": {
        type: Sequelize.ENUM('pending','ready','picked_up','cancelled'),
        allowNull: false,
        defaultValue: "pending",
      },
      "picked_up_at": {
        type: Sequelize.DATE,
      },
      "created_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "updated_at": {
        type: Sequelize.DATE,
      },
    }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('order', ["user_id"], {
      name: 'user_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('order', 'user_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('order');
  }
};
