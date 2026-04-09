'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blast_message_logs', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "meta_blast_message_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "phone_number": {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      "status": {
        type: Sequelize.ENUM('success','failed'),
        allowNull: false,
      },
      "json": {
        type: Sequelize.TEXT('long'),
      },
      "created_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    }, {
    charset: 'utf8mb4',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('blast_message_logs', ["meta_blast_message_id"], {
      name: 'idx_meta_blast_message_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('blast_message_logs', ["phone_number"], {
      name: 'idx_phone_number'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('blast_message_logs', {
      fields: ["meta_blast_message_id"],
      type: 'foreign key',
      name: 'fk_blast_message_logs_blast',
      references: {
        table: 'meta_blast_message',
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
      await queryInterface.removeConstraint('blast_message_logs', 'fk_blast_message_logs_blast');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('blast_message_logs', 'idx_meta_blast_message_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('blast_message_logs', 'idx_phone_number');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('blast_message_logs');
  }
};
