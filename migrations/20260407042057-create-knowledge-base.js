'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('knowledge_base', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "title": {
        type: Sequelize.STRING(255),
      },
      "category_id": {
        type: Sequelize.INTEGER,
      },
      "question": {
        type: Sequelize.TEXT,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
      "answer": {
        type: Sequelize.TEXT,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
      "status": {
        type: Sequelize.ENUM('active','inactive'),
        allowNull: false,
        defaultValue: "active",
      },
      "modified_by": {
        type: Sequelize.INTEGER,
      },
      "created_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "updated_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "views": {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      "is_default": {
        type: Sequelize.TINYINT(1),
        defaultValue: 0,
      },
    }, {
      charset: 'latin1',
      engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('knowledge_base', ["category_id"], {
        name: 'fk_kb_category'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('knowledge_base', {
        fields: ["category_id"],
        type: 'foreign key',
        name: 'fk_kb_category',
        references: {
          table: 'knowledge_base_categories',
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
      await queryInterface.removeConstraint('knowledge_base', 'fk_kb_category');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('knowledge_base', 'fk_kb_category');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('knowledge_base');
  }
};
