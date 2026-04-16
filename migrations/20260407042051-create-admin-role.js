'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_role', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "slug": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      "name": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "is_active": {
        type: Sequelize.ENUM('active','inactive'),
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
      charset: 'latin1',
      engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('admin_role', ["name"], {
        name: 'name',
        unique: true,
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('admin_role', 'name');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('admin_role');
  }
};
