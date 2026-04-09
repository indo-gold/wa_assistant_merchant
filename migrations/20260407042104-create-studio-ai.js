'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('studio_ai', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "studio": {
        type: Sequelize.STRING(25),
        allowNull: false,
      },
      "is_active": {
        type: Sequelize.ENUM('active','inactive'),
        allowNull: false,
      },
      "is_used": {
        type: Sequelize.ENUM('0','1'),
        allowNull: false,
      },
      "hybrid": {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "0=tidak, 1=iya",
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('studio_ai');
  }
};
