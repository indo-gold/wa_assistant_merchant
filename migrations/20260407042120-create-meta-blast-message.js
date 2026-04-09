'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('meta_blast_message', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "title": {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      "template_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "status": {
        type: Sequelize.ENUM('active','inactive'),
        allowNull: false,
      },
      "execute_date": {
        type: Sequelize.DATE,
      },
      "is_send_now": {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      "upload_recipients_id": {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      "upload_path": {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      "recipients_loaded": {
        type: Sequelize.TINYINT(1),
        defaultValue: 0,
      },
      "total_recipients": {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      "sent_count": {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      "delivered_count": {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      "read_count": {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      "failed_count": {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      "last_activity_at": {
        type: Sequelize.DATE,
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
      "processing_status": {
        type: Sequelize.ENUM('scheduled','processing','completed','error','paused'),
        allowNull: false,
        defaultValue: "scheduled",
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('meta_blast_message', ["upload_recipients_id"], {
      name: 'idx_upload_recipients_id'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('meta_blast_message', ["template_id"], {
      name: 'idx_meta_templates_message'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('meta_blast_message', 'idx_upload_recipients_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('meta_blast_message', 'idx_meta_templates_message');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('meta_blast_message');
  }
};
