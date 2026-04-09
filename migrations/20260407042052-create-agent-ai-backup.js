'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agent_ai_backup', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: 0,
      },
      "studio_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "hybrid_studio_id": {
        type: Sequelize.INTEGER,
      },
      "name": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "model": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      "parameters": {
        type: Sequelize.TEXT('long'),
      },
      "instruction": {
        type: Sequelize.TEXT,
      },
      "first_chat": {
        type: Sequelize.TEXT,
      },
      "is_used": {
        type: Sequelize.ENUM('0','1'),
        allowNull: false,
      },
      "timestamp": {
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
    await queryInterface.dropTable('agent_ai_backup');
  }
};
