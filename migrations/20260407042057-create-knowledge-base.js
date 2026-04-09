'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('knowledge_base', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "keyword": {
        type: Sequelize.STRING(255),
      },
      "question": {
        type: Sequelize.TEXT,
      },
      "answer": {
        type: Sequelize.TEXT,
      },
      "status": {
        type: Sequelize.ENUM('active','inactive'),
        allowNull: false,
        defaultValue: "active",
      },
      "modifiy_by": {
        type: Sequelize.INTEGER,
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('knowledge_base');
  }
};
