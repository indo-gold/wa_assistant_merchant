'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promo_usage_logs', {
      "id": {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "promo_id": {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      "user_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "order_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "discount_amount": {
        type: Sequelize.DECIMAL(15,2),
        allowNull: false,
      },
      "used_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('promo_usage_logs', ["promo_id"], {
      name: 'idx_usage_promo'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('promo_usage_logs', ["user_id"], {
      name: 'idx_usage_user'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('promo_usage_logs', {
      fields: ["promo_id"],
      type: 'foreign key',
      name: 'fk_usage_promo',
      references: {
        table: 'promos',
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
      await queryInterface.addConstraint('promo_usage_logs', {
      fields: ["user_id"],
      type: 'foreign key',
      name: 'fk_usage_user',
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
      await queryInterface.removeConstraint('promo_usage_logs', 'fk_usage_promo');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('promo_usage_logs', 'fk_usage_user');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('promo_usage_logs', 'idx_usage_promo');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('promo_usage_logs', 'idx_usage_user');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('promo_usage_logs');
  }
};
