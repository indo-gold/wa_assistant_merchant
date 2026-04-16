'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('upload_recipients', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "uuid": {
        type: Sequelize.CHAR(36),
        allowNull: false,
      },
      "title": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "file_name": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "upload_path": {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      "file_size": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "total_contacts": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "valid_contacts": {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      "invalid_contacts": {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      "hash": {
        type: Sequelize.STRING(64),
      },
      "status": {
        type: Sequelize.ENUM('draft','ready','used','archived'),
        defaultValue: "draft",
      },
      "created_by": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "created_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "updated_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
      "deleted_at": {
        type: Sequelize.DATE,
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addConstraint('upload_recipients', {
      fields: ["uuid"],
      type: 'unique',
      name: 'uuid'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('upload_recipients', 'uuid');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('upload_recipients');
  }
};
