'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'products_history',
      {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        product_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        product_name: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        variant_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        variant_name: {
          type: Sequelize.STRING(50),
          allowNull: false,
          primaryKey: true,
        },
        denomination: {
          type: Sequelize.DOUBLE,
          allowNull: false,
        },
        price: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      },
      {
        charset: 'latin1',
        engine: 'InnoDB',
      },
    );
    try {
      await queryInterface.addIndex('products_history', ['product_id'], {
        name: 'product_id',
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
    try {
      await queryInterface.addIndex('products_history', ['product_name'], {
        name: 'product_name',
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
    try {
      await queryInterface.addIndex('products_history', ['denomination'], {
        name: 'denomination',
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
      await queryInterface.removeIndex('products_history', 'product_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('products_history', 'product_name');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('products_history', 'denomination');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('products_history');
  }
};
