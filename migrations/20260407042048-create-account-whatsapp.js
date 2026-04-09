'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('account_whatsapp', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "sender_name": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      "business_id": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "phone_number_id": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "waba_id": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "meta_app_id": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "whatsapp_access_token": {
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
    await queryInterface.dropTable('account_whatsapp');
  }
};
