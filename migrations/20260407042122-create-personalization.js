'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('personalization', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "user_id": {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      "personality": {
        type: Sequelize.TEXT,
      },
      "nickname": {
        type: Sequelize.STRING(100),
      },
      "age": {
        type: Sequelize.INTEGER,
      },
      "occupation": {
        type: Sequelize.STRING(100),
      },
      "language_style": {
        type: Sequelize.STRING(50),
      },
      "interests": {
        type: Sequelize.TEXT,
      },
      "notes": {
        type: Sequelize.TEXT,
      },
      "reminder": {
        type: Sequelize.TEXT('long'),
        charset: 'utf8mb4',
        collate: 'utf8mb4_bin',
      },
      "timestamp": {
        type: Sequelize.DATE,
      },
    }, {
      charset: 'latin1',
      engine: 'InnoDB',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('personalization');
  }
};
