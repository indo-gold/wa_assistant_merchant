'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cost', 'operation_type', {
      type: Sequelize.ENUM(
        'chat_completion',
        'vision_analysis',
        'audio_transcription',
        'tool_execution',
      ),
      allowNull: false,
      defaultValue: 'chat_completion',
    });

    await queryInterface.addIndex('cost', ['operation_type'], {
      name: 'idx_cost_operation_type',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('cost', 'idx_cost_operation_type');
    await queryInterface.removeColumn('cost', 'operation_type');
  },
};
