'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('order', 'payment_status', {
      type: Sequelize.ENUM('pending', 'paid', 'expired', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('order', 'payment_status', {
      type: Sequelize.ENUM('pending', 'paid', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },
};
