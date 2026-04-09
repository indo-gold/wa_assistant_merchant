'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin', {
      "id": {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "name": {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      "email": {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      "role_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "is_active": {
        type: Sequelize.ENUM('active','inactive'),
        allowNull: false,
      },
      "password": {
        type: Sequelize.STRING(255),
        allowNull: false,
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
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addConstraint('admin', {
      fields: ["email"],
      type: 'unique',
      name: 'email'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('admin', 'email');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('admin');
  }
};
