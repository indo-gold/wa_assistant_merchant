'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_role_permissions', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "role_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "permission_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "is_homepage": {
        type: Sequelize.TINYINT(1),
        allowNull: true,
        defaultValue: 0,
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
      await queryInterface.addIndex('admin_role_permissions', ["role_id", "permission_id"], {
        name: 'role_permission',
        unique: true,
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('admin_role_permissions', ["permission_id"], {
        name: 'permission_id'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('admin_role_permissions', {
        fields: ["role_id"],
        type: 'foreign key',
        name: 'fk_role_perm_role',
        references: {
          table: 'admin_role',
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
      await queryInterface.addConstraint('admin_role_permissions', {
        fields: ["permission_id"],
        type: 'foreign key',
        name: 'fk_role_perm_permission',
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
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('admin_role_permissions', 'fk_role_perm_permission');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('admin_role_permissions', 'fk_role_perm_role');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('admin_role_permissions', 'permission_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('admin_role_permissions', 'role_permission');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('admin_role_permissions');
  }
};
