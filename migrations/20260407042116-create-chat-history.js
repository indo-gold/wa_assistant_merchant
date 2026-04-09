'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_history', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "user_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "wa_message_id": {
        type: Sequelize.STRING(255),
      },
      "reply_wa_message_id": {
        type: Sequelize.STRING(255),
      },
      "message": {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      "type": {
        type: Sequelize.ENUM('text','interactive','image','striker','document','audio','video','order','template','reaction'),
        defaultValue: "text",
      },
      "role": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "status": {
        type: Sequelize.ENUM('sent','delivered','read','failed'),
        allowNull: false,
      },
      "json_data": {
        type: Sequelize.TEXT('long'),
      },
      "admin_id": {
        type: Sequelize.INTEGER,
      },
      "is_llm_read": {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 1,
      },
      "timestamp": {
        type: Sequelize.DATE,
      },
      "processed_content": {
        type: Sequelize.TEXT,
      },
    }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('chat_history', ["user_id"], {
      name: 'user_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('chat_history', ["processed_content"], {
      name: 'idx_chat_history_processed_content',
      type: 'FULLTEXT'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('chat_history', {
      fields: ["user_id"],
      type: 'foreign key',
      name: 'chat_history_ibfk_1',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('chat_history', 'chat_history_ibfk_1');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('chat_history', 'user_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('chat_history', 'idx_chat_history_processed_content');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('chat_history');
  }
};
