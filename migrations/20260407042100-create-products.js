'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'products',
      {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        product_name: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        variant_name: {
          type: Sequelize.STRING(255),
        },
        denomination: {
          type: Sequelize.DOUBLE,
          allowNull: false,
        },
        price: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        max_quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        products_sold: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        discount_price: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        image: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        is_po: {
          type: Sequelize.TINYINT(1),
          allowNull: false,
          defaultValue: 0,
        },
        automatic_po: {
          type: Sequelize.TINYINT(1),
          allowNull: false,
          defaultValue: 0,
        },
        est_date_po: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        stock_po: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        charset: 'latin1',
        engine: 'InnoDB',
      },
    );
    try {
      await queryInterface.addConstraint('products', {
        fields: ['product_name', 'variant_name', 'denomination'],
        type: 'unique',
        name: 'unique_product_variant_denomination',
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (
        !msg.includes('Duplicate key name') &&
        !msg.includes('already exists') &&
        !msg.includes('errno: 121') &&
        !msg.includes('Duplicate key on write or update')
      )
        throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('products', 'unique_product_variant_denomination');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('products');
  },
};
