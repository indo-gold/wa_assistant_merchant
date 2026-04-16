'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_menu_items', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "permission_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "parent_id": {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      "label": {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      "path": {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      "icon": {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      "sort_order": {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      "is_active": {
        type: Sequelize.TINYINT(1),
        allowNull: true,
        defaultValue: 1,
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
      await queryInterface.addIndex('admin_menu_items', ["permission_id"], {
        name: 'permission_id'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('admin_menu_items', ["parent_id"], {
        name: 'parent_id'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('admin_menu_items', {
        fields: ["permission_id"],
        type: 'foreign key',
        name: 'fk_menu_permission',
        references: {
          table: 'admin_permissions',
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
      await queryInterface.addConstraint('admin_menu_items', {
        fields: ["parent_id"],
        type: 'foreign key',
        name: 'fk_menu_parent',
        references: {
          table: 'admin_menu_items',
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
      await queryInterface.removeConstraint('admin_menu_items', 'fk_menu_parent');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('admin_menu_items', 'fk_menu_permission');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('admin_menu_items', 'parent_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('admin_menu_items', 'permission_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('admin_menu_items');
  }
};
