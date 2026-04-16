'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cost', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "user_id": {
        type: Sequelize.INTEGER,
      },
      "object": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      "created": {
        type: Sequelize.INTEGER,
      },
      "model": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      "prompt_tokens": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "cached_tokens": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "completion_tokens": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "messages_payload": {
        type: Sequelize.TEXT('long'),
      },
      "json_data": {
        type: Sequelize.TEXT('long'),
        allowNull: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_bin',
      },
      "estimate_cost": {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      "execution_time": {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      "agent_id": {
        type: Sequelize.INTEGER,
      },
      "model_ai_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "wa_message_id": {
        type: Sequelize.STRING(255),
      },
      "timestamp": {
        type: Sequelize.DATE,
      },
      "operation_type": {
        type: Sequelize.ENUM('chat_completion','vision_analysis','audio_transcription','tool_execution'),
        allowNull: false,
        defaultValue: "chat_completion",
      },
    }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('cost', ["user_id"], {
      name: 'user_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('cost', ["model_ai_id"], {
      name: 'model_ai_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('cost', ["agent_id"], {
      name: 'agent_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('cost', ["wa_message_id"], {
      name: 'wa_message_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('cost', ["operation_type"], {
      name: 'idx_cost_operation_type'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('cost', 'user_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('cost', 'model_ai_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('cost', 'agent_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('cost', 'wa_message_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('cost', 'idx_cost_operation_type');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('cost');
  }
};
