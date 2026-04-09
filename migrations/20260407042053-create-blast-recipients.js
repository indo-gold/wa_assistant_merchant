'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blast_recipients', {
      "id": {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "blast_id": {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      "phone": {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      "status": {
        type: Sequelize.ENUM('pending','sending','sent','delivered','read','failed'),
        allowNull: false,
        defaultValue: "pending",
      },
      "retry_count": {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      "next_attempt_at": {
        type: Sequelize.DATE,
      },
      "locked_at": {
        type: Sequelize.DATE,
      },
      "worker_id": {
        type: Sequelize.STRING(64),
      },
      "last_error": {
        type: Sequelize.TEXT,
      },
      "wa_message_id": {
        type: Sequelize.STRING(128),
      },
      "template_send": {
        type: Sequelize.TEXT,
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addConstraint('blast_recipients', {
      fields: ["blast_id","phone"],
      type: 'unique',
      name: 'uq_blast_phone'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('blast_recipients', ["blast_id","status","next_attempt_at"], {
      name: 'idx_status_next'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('blast_recipients', ["blast_id","status","locked_at"], {
      name: 'idx_locked'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('blast_recipients', 'uq_blast_phone');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('blast_recipients', 'idx_status_next');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('blast_recipients', 'idx_locked');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('blast_recipients');
  }
};
