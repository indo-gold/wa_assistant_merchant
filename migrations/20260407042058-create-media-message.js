'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('media_message', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "wa_message_id": {
        type: Sequelize.STRING(255),
      },
      "file_name": {
        type: Sequelize.STRING(255),
      },
      "original_name": {
        type: Sequelize.STRING(255),
      },
      "url": {
        type: Sequelize.TEXT,
      },
      "caption": {
        type: Sequelize.TEXT,
      },
      "timestamp": {
        type: Sequelize.DATE,
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('media_message');
  }
};
