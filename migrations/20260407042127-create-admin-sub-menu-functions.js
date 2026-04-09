'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_sub_menu_functions', {
      "sub_menu_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      "function_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('admin_sub_menu_functions', ["function_id"], {
      name: 'function_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('admin_sub_menu_functions', {
      fields: ["sub_menu_id"],
      type: 'foreign key',
      name: 'admin_sub_menu_functions_ibfk_1',
      references: {
        table: 'admin_sub_menus',
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
      await queryInterface.addConstraint('admin_sub_menu_functions', {
      fields: ["function_id"],
      type: 'foreign key',
      name: 'admin_sub_menu_functions_ibfk_2',
      references: {
        table: 'admin_functions',
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
      await queryInterface.removeConstraint('admin_sub_menu_functions', 'admin_sub_menu_functions_ibfk_1');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('admin_sub_menu_functions', 'admin_sub_menu_functions_ibfk_2');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('admin_sub_menu_functions', 'function_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('admin_sub_menu_functions');
  }
};
