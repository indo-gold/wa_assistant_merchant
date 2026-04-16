'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('meta_templates_message', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "template_id": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      "template_name": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "category": {
        type: Sequelize.ENUM('marketing','utility','authentication'),
        allowNull: false,
      },
      "status": {
        type: Sequelize.ENUM('pending','rejected','approved'),
        allowNull: false,
      },
      "json": {
        type: Sequelize.TEXT('long'),
        allowNull: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_bin',
      },
      "meta_response": {
        type: Sequelize.TEXT('long'),
      },
      "media_url": {
        type: Sequelize.TEXT('long'),
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
    await queryInterface.dropTable('meta_templates_message');
  }
};
