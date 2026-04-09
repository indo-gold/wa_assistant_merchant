'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('error_log', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "error": {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      "timestamp": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('error_log');
  }
};
