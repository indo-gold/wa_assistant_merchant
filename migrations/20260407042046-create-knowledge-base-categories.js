'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('knowledge_base_categories', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "name": {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      "slug": {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      "description": {
        type: Sequelize.TEXT,
      },
      "sort_order": {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      "is_active": {
        type: Sequelize.TINYINT(1),
        defaultValue: 1,
      },
      "created_at": {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "updated_at": {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
      "icon": {
        type: Sequelize.STRING(50),
        defaultValue: 'file-text',
      },
      "color": {
        type: Sequelize.STRING(20),
        defaultValue: 'blue',
      },
    }, {
      charset: 'latin1',
      engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('knowledge_base_categories', ["slug"], {
        name: 'slug',
        unique: true,
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('knowledge_base_categories', 'slug');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('knowledge_base_categories');
  }
};
