'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ktp_verifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nik: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      nama: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      tempat_lahir: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      tanggal_lahir: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      jenis_kelamin: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      alamat: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      rt: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      rw: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      kelurahan: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      kecamatan: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      kabupaten: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      provinsi: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      agama: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      status_perkawinan: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      pekerjaan: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      kewarganegaraan: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      berlaku_hingga: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      file_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      raw_ocr: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('ktp_verifications', ['user_id'], {
      name: 'idx_ktp_verifications_user_id',
    });

    await queryInterface.addIndex('ktp_verifications', ['nik'], {
      name: 'idx_ktp_verifications_nik',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ktp_verifications');
  },
};
