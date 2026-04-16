'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_bot_onoff_notes', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "admin_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "user_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "bot_status": {
        type: Sequelize.ENUM('active','silent_bot'),
        allowNull: false,
      },
      "notes": {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('admin_bot_onoff_notes');
  }
};
