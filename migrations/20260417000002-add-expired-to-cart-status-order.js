'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('cart', 'status_order', {
      type: Sequelize.ENUM('pending', 'cancelled', 'approved', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('cart', 'status_order', {
      type: Sequelize.ENUM('pending', 'cancelled', 'approved'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },
};
