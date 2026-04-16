'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('follow_up_sales', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "order_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "follow_up_by": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "user_result": {
        type: Sequelize.ENUM('no response','not_interested','purchase'),
      },
      "remarks": {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      "follow_up_date": {
        type: Sequelize.DATE,
        allowNull: false,
      },
    }, {
      charset: 'latin1',
      engine: 'InnoDB',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('follow_up_sales');
  }
};
