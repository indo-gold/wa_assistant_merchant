'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_penalty', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "user_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "penalty_until": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "status": {
        type: Sequelize.ENUM('running','end'),
        allowNull: false,
        defaultValue: "running",
      },
      "timestamp": {
        type: Sequelize.DATE,
        allowNull: false,
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_penalty');
  }
};
