'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_role_access', {
      "role_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
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
      "is_homepage": {
        type: Sequelize.TINYINT(1),
        defaultValue: 0,
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('admin_role_access', ["sub_menu_id"], {
      name: 'sub_menu_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('admin_role_access', ["function_id"], {
      name: 'function_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('admin_role_access', {
      fields: ["sub_menu_id"],
      type: 'foreign key',
      name: 'admin_role_access_ibfk_1',
      references: {
        table: 'admin_sub_menus',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('admin_role_access', {
      fields: ["function_id"],
      type: 'foreign key',
      name: 'admin_role_access_ibfk_2',
      references: {
        table: 'admin_functions',
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
      await queryInterface.removeConstraint('admin_role_access', 'admin_role_access_ibfk_1');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('admin_role_access', 'admin_role_access_ibfk_2');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('admin_role_access', 'sub_menu_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('admin_role_access', 'function_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('admin_role_access');
  }
};
