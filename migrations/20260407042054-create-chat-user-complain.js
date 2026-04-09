'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_user_complain', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "wa_message_id": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "issue_category": {
        type: Sequelize.ENUM('link','image','aI assistant intelligence','product','response speed','language style','other'),
        allowNull: false,
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
    await queryInterface.dropTable('chat_user_complain');
  }
};
