'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_permissions', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "resource": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      "action": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      "description": {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      "created_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "updated_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    }, {
      charset: 'utf8mb4',
      engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('admin_permissions', ["resource", "action"], {
        name: 'resource_action',
        unique: true,
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('admin_permissions', 'resource_action');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('admin_permissions');
  }
};
