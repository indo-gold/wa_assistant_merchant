'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('survey', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "slug": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "title": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "text": {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      "time": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "status": {
        type: Sequelize.ENUM('active','inactive'),
        allowNull: false,
      },
      "modifiy_by": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "delete": {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
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
    try {
      await queryInterface.addConstraint('survey', {
      fields: ["title"],
      type: 'unique',
      name: 'title'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('survey', 'title');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('survey');
  }
};
