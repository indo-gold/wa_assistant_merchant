'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('model_ai', {
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
      "model": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      "status": {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "1=aktif, 0=tidak aktif",
      },
      "token_per": {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      "input": {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      "cached": {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      "output": {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      "rpm": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "rpd": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "tpm": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "tpd": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('model_ai', ["studio_id"], {
      name: 'studio_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('model_ai', {
      fields: ["studio_id"],
      type: 'foreign key',
      name: 'fk_model_ai_studio_id',
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
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('model_ai', 'fk_model_ai_studio_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('model_ai', 'studio_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('model_ai');
  }
};
