'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ktp_verifications', {
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
      "order_id": {
        type: Sequelize.INTEGER,
      },
      "nik": {
        type: Sequelize.STRING(255),
      },
      "nama": {
        type: Sequelize.STRING(255),
      },
      "tempat_lahir": {
        type: Sequelize.STRING(255),
      },
      "tanggal_lahir": {
        type: Sequelize.STRING(255),
      },
      "jenis_kelamin": {
        type: Sequelize.STRING(255),
      },
      "alamat": {
        type: Sequelize.TEXT,
      },
      "rt": {
        type: Sequelize.STRING(255),
      },
      "rw": {
        type: Sequelize.STRING(255),
      },
      "kelurahan": {
        type: Sequelize.STRING(255),
      },
      "kecamatan": {
        type: Sequelize.STRING(255),
      },
      "kabupaten": {
        type: Sequelize.STRING(255),
      },
      "provinsi": {
        type: Sequelize.STRING(255),
      },
      "agama": {
        type: Sequelize.STRING(255),
      },
      "status_perkawinan": {
        type: Sequelize.STRING(255),
      },
      "pekerjaan": {
        type: Sequelize.STRING(255),
      },
      "kewarganegaraan": {
        type: Sequelize.STRING(255),
      },
      "berlaku_hingga": {
        type: Sequelize.STRING(255),
      },
      "file_url": {
        type: Sequelize.TEXT,
      },
      "raw_ocr": {
        type: Sequelize.TEXT('long'),
      },
      "is_verified": {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
      },
      "created_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      "updated_at": {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });
    try {
      await queryInterface.addIndex('ktp_verifications', ["user_id"], {
        name: 'idx_ktp_verifications_user_id'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('ktp_verifications', ["nik"], {
        name: 'idx_ktp_verifications_nik'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('ktp_verifications', ["order_id"], {
        name: 'idx_order_id'
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addIndex('ktp_verifications', ["order_id"], {
        name: 'unique_order_ktp',
        unique: true,
      });
    } catch (e) {
      const msg = (e && e.message) || '';
      if (!msg.includes('Duplicate key name') && !msg.includes('already exists') && !msg.includes('errno: 121') && !msg.includes('Duplicate key on write or update')) throw e;
    }
    try {
      await queryInterface.addConstraint('ktp_verifications', {
        fields: ["user_id"],
        type: 'foreign key',
        name: 'fk_ktp_verifications_user_id',
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
      await queryInterface.removeConstraint('ktp_verifications', 'fk_ktp_verifications_user_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('ktp_verifications', 'unique_order_ktp');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('ktp_verifications', 'idx_order_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('ktp_verifications', 'idx_ktp_verifications_nik');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    try {
      await queryInterface.removeIndex('ktp_verifications', 'idx_ktp_verifications_user_id');
    } catch (e) {
      /* ignore if doesn't exist */
    }
    await queryInterface.dropTable('ktp_verifications');
  }
};
