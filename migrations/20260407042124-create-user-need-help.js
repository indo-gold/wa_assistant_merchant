'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_need_help', {
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
      "topic": {
        type: Sequelize.TEXT,
      },
      "session_status": {
        type: Sequelize.ENUM('waiting','closed'),
        allowNull: false,
        defaultValue: "waiting",
      },
      "remarks": {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('user_need_help');
  }
};
