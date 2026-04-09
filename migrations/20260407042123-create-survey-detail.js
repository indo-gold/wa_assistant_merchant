'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('survey_detail', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "survey_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "user_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "activity": {
        type: Sequelize.ENUM('generate_link','open_link','completed'),
        allowNull: false,
      },
      "unique": {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      "wa_message_id": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "created_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('survey_detail');
  }
};
