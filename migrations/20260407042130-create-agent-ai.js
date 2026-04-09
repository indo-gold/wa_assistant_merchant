'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agent_ai', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "studio_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "name": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "model_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "hybrid_model_id": {
        type: Sequelize.INTEGER,
      },
      "parameters": {
        type: Sequelize.TEXT('long'),
      },
      "instruction": {
        type: Sequelize.TEXT,
      },
      "is_used": {
        type: Sequelize.ENUM('0','1'),
        allowNull: false,
      },
      "timestamp": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('agent_ai', ["studio_id"], {
      name: 'studio_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('agent_ai', ["model_id"], {
      name: 'idx_agent_ai_model_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('agent_ai', ["hybrid_model_id"], {
      name: 'idx_agent_ai_hybrid_model_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('agent_ai', {
      fields: ["studio_id"],
      type: 'foreign key',
      name: 'fk_agent_ai_studio_id',
      references: {
        table: 'studio_ai',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('agent_ai', {
      fields: ["model_id"],
      type: 'foreign key',
      name: 'fk_agent_ai_model_id',
      references: {
        table: 'model_ai',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('agent_ai', {
      fields: ["hybrid_model_id"],
      type: 'foreign key',
      name: 'fk_agent_ai_hybrid_model_id',
      references: {
        table: 'model_ai',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('agent_ai', 'fk_agent_ai_studio_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('agent_ai', 'fk_agent_ai_model_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeConstraint('agent_ai', 'fk_agent_ai_hybrid_model_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('agent_ai', 'studio_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('agent_ai', 'idx_agent_ai_model_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('agent_ai', 'idx_agent_ai_hybrid_model_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('agent_ai');
  }
};
