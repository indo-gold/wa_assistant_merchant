'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop old columns
    await queryInterface.removeColumn('agent_ai', 'model');
    await queryInterface.removeColumn('agent_ai', 'hybrid_studio_id');

    // Add new columns referencing model_ai
    await queryInterface.addColumn('agent_ai', 'model_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('agent_ai', 'hybrid_model_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });

    // Add foreign key constraints
    await queryInterface.addConstraint('agent_ai', {
      fields: ['model_id'],
      type: 'foreign key',
      name: 'fk_agent_ai_model_id',
      references: {
        table: 'model_ai',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    await queryInterface.addConstraint('agent_ai', {
      fields: ['hybrid_model_id'],
      type: 'foreign key',
      name: 'fk_agent_ai_hybrid_model_id',
      references: {
        table: 'model_ai',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Add indexes
    await queryInterface.addIndex('agent_ai', ['model_id'], {
      name: 'idx_agent_ai_model_id',
    });

    await queryInterface.addIndex('agent_ai', ['hybrid_model_id'], {
      name: 'idx_agent_ai_hybrid_model_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('agent_ai', 'idx_agent_ai_hybrid_model_id');
    await queryInterface.removeIndex('agent_ai', 'idx_agent_ai_model_id');

    await queryInterface.removeConstraint('agent_ai', 'fk_agent_ai_hybrid_model_id');
    await queryInterface.removeConstraint('agent_ai', 'fk_agent_ai_model_id');

    await queryInterface.removeColumn('agent_ai', 'hybrid_model_id');
    await queryInterface.removeColumn('agent_ai', 'model_id');

    await queryInterface.addColumn('agent_ai', 'model', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: '',
    });

    await queryInterface.addColumn('agent_ai', 'hybrid_studio_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });
  },
};
