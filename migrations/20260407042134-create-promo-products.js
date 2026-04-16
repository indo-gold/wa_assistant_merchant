'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promo_products', {
      "promo_id": {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      "product_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      "created_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "updated_at": {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NULL ON UPDATE CURRENT_TIMESTAMP"),
      },
    }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('promo_products', ["promo_id"], {
      name: 'idx_promo_product_promo'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('promo_products', ["product_id"], {
      name: 'idx_promo_product_product'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('promo_products', {
      fields: ["promo_id"],
      type: 'foreign key',
      name: 'fk_promo_product_promo',
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
      await queryInterface.addConstraint('promo_products', {
      fields: ["product_id"],
      type: 'foreign key',
      name: 'fk_promo_product_product',
      references: {
        table: 'products',
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
      await queryInterface.removeConstraint('promo_products', 'fk_promo_product_promo');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('promo_products', 'fk_promo_product_product');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('promo_products', 'idx_promo_product_promo');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('promo_products', 'idx_promo_product_product');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('promo_products');
  }
};
