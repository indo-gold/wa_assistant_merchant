'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_history', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "order_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "status": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      "note": {
        type: Sequelize.TEXT,
      },
      "created_by": {
        type: Sequelize.STRING(100),
      },
      "created_at": {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    }, {
      charset: 'utf8mb4',
      engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('order_history', ["order_id"], {
        name: 'idx_order_id'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('order_history', {
        fields: ["order_id"],
        type: 'foreign key',
        name: 'order_history_ibfk_1',
        references: {
          table: 'order',
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
      await queryInterface.removeConstraint('order_history', 'order_history_ibfk_1');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('order_history', 'idx_order_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('order_history');
  }
};
