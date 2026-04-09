'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promos', {
      "id": {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "name": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "description": {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      "discount_type": {
        type: Sequelize.ENUM('percentage','fixed_amount','free_shipping'),
        allowNull: false,
      },
      "discount_value": {
        type: Sequelize.DECIMAL(15,2),
        allowNull: false,
        defaultValue: "0.00",
      },
      "min_purchase_amount": {
        type: Sequelize.DECIMAL(15,2),
        allowNull: false,
        defaultValue: "0.00",
      },
      "max_discount_amount": {
        type: Sequelize.DECIMAL(15,2),
      },
      "start_date": {
        type: Sequelize.DATE,
        allowNull: false,
      },
      "end_date": {
        type: Sequelize.DATE,
        allowNull: false,
      },
      "is_active": {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 1,
      },
      "applies_to_all_products": {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
      },
      "is_single_product_promo": {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
      },
      "usage_limit": {
        type: Sequelize.INTEGER.UNSIGNED,
      },
      "banner_image": {
        type: Sequelize.STRING(500),
      },
      "max_usage_per_user": {
        type: Sequelize.INTEGER,
      },
      "created_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "updated_at": {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('promos', ["is_active","start_date","end_date"], {
      name: 'idx_promo_active_dates'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('promos', 'idx_promo_active_dates');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('promos');
  }
};
