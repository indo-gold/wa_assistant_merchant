'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_sub_menus', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "menu_id": {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      "name": {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('admin_sub_menus', ["menu_id"], {
      name: 'admin_sub_menus_ibfk_1'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('admin_sub_menus', {
      fields: ["menu_id"],
      type: 'foreign key',
      name: 'admin_sub_menus_ibfk_1',
      references: {
        table: 'admin_menus',
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
      await queryInterface.removeConstraint('admin_sub_menus', 'admin_sub_menus_ibfk_1');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('admin_sub_menus', 'admin_sub_menus_ibfk_1');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('admin_sub_menus');
  }
};
