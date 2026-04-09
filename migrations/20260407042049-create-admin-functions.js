'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('admin_functions', {
      "id": {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      "name": {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
    }, {
    charset: 'latin1',
    engine: 'InnoDB',
    });
    try {
      await queryInterface.addConstraint('admin_functions', {
      fields: ["name"],
      type: 'unique',
      name: 'name'
    });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('admin_functions', 'name');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('admin_functions');
  }
};
