'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reminder_products', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "product_id": {
        type: Sequelize.INTEGER,
      },
      "product_name": {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      "variant_name": {
        type: Sequelize.STRING(50),
      },
      "denomination": {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      "followup": {
        type: Sequelize.DATE,
      },
      "from": {
        type: Sequelize.ENUM('user request reminder','failed order'),
        allowNull: false,
      },
      "user_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "wa_message_id": {
        type: Sequelize.STRING(255),
      },
      "created_at": {
        type: Sequelize.DATE,
        allowNull: false,
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reminder_products');
  }
};
