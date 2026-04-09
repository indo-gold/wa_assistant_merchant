'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        comment: "di User",
      },
      "name": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "phone_number": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "status": {
        type: Sequelize.ENUM('active','block','silent_bot'),
        allowNull: false,
        defaultValue: "active",
      },
      "pin": {
        type: Sequelize.ENUM('active','inactive'),
        allowNull: false,
        defaultValue: "inactive",
      },
      "timestamp": {
        type: Sequelize.DATE,
      },
    }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addConstraint('users', {
      fields: ["phone_number"],
      type: 'unique',
      name: 'phone_number'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('users', 'phone_number');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('users');
  }
};
