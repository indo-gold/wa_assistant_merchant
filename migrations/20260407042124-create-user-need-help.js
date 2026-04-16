'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_need_help', {
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
      "topic": {
        type: Sequelize.TEXT,
      },
      "session_status": {
        type: Sequelize.ENUM('waiting','closed'),
        allowNull: false,
        defaultValue: "waiting",
      },
      "remarks": {
        type: Sequelize.TEXT,
      },
      "timestamp": {
        type: Sequelize.DATE,
      },
    }, {
      charset: 'latin1',
      engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('user_need_help', ["user_id"], {
        name: 'fk_user_need_help_user'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('user_need_help', {
        fields: ["user_id"],
        type: 'foreign key',
        name: 'fk_user_need_help_user',
        references: {
          table: 'users',
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
      await queryInterface.removeConstraint('user_need_help', 'fk_user_need_help_user');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('user_need_help', 'fk_user_need_help_user');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('user_need_help');
  }
};
