/**
 * ============================================================================
 * DATABASE CONFIGURATION - Sequelize
 * ============================================================================
 * 
 * File ini berisi konfigurasi database menggunakan Sequelize ORM.
 * Support untuk MySQL dengan charset utf8mb4 untuk emoji dan karakter khusus.
 * 
 * Fitur:
 * - Connection pooling untuk performa lebih baik
 * - Auto timezone configuration untuk WIB (Jakarta)
 * - Logging dengan Pino
 * - Reconnection handling
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from '@nestjs/sequelize';

/**
 * ============================================================================
 * DATABASE CONFIG SERVICE
 * ============================================================================
 * Service untuk mengkonfigurasi koneksi database Sequelize
 */
@Injectable()
export class DatabaseConfig implements SequelizeOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  /**
   * ==========================================================================
   * CREATE SEQUELIZE OPTIONS
   * ==========================================================================
   * Membuat konfigurasi Sequelize options dari environment variables
   * 
   * @returns SequelizeModuleOptions
   */
  createSequelizeOptions(): SequelizeModuleOptions {
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    
    return {
      // ========================================================================
      // CONNECTION SETTINGS
      // ========================================================================
      dialect: 'mysql',
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: this.configService.get<number>('DATABASE_PORT', 3306),
      username: this.configService.get<string>('DATABASE_USERNAME', 'root'),
      password: this.configService.get<string>('DATABASE_PASSWORD', ''),
      database: this.configService.get<string>('DATABASE', 'chatbot'),

      // ========================================================================
      // CONNECTION POOL
      // ========================================================================
      // Pooling untuk mengelola multiple connections secara efisien
      pool: {
        max: 10,        // Maximum connections dalam pool
        min: 0,         // Minimum connections dalam pool
        acquire: 30000, // Maximum time (ms) untuk acquire connection
        idle: 10000,    // Maximum time (ms) connection boleh idle
      },

      // ========================================================================
      // CHARSET & COLLATION
      // ========================================================================
      // utf8mb4 untuk support emoji dan karakter unicode lengkap
      dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },

      // ========================================================================
      // TIMEZONE
      // ========================================================================
      // Set timezone ke WIB (Jakarta) UTC+7
      timezone: '+07:00',

      // ========================================================================
      // LOGGING
      // ========================================================================
      // Enable logging di development, disable di production
      logging: isDevelopment ? this.createLogger() : false,

      // ========================================================================
      // MODEL SETTINGS
      // ========================================================================
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timestamps: false, // Disable default timestamps, pakai custom
        underscored: true, // Convert camelCase ke snake_case
      },

      // ========================================================================
      // SYNC SETTINGS
      // ========================================================================
      // WARNING: Jangan enable force/sync di production!
      synchronize: false, // Set true hanya untuk development
      autoLoadModels: true, // Auto load models dari folder models

      // ========================================================================
      // RETRY SETTINGS
      // ========================================================================
      // Retry logic untuk handling connection failures
      retry: {
        max: 3, // Maximum retry attempts
      },
    };
  }

  /**
   * ==========================================================================
   * CREATE LOGGER FUNCTION
   * ==========================================================================
   * Membuat logger function untuk query logging
   * 
   * @returns Logger function
   */
  private createLogger(): (msg: string) => void {
    return (msg: string): void => {
      // Log query dengan format yang readable
      console.log(`🗄️  [Sequelize] ${msg}`);
    };
  }
}

/**
 * ============================================================================
 * SEQUELIZE CONFIG OBJECT
 * ============================================================================
 * Config object untuk Sequelize CLI (migrations & seeds)
 */
export const sequelizeConfig = {
  development: {
    dialect: 'mysql' as const,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    username: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE || 'chatbot',
    timezone: '+07:00',
    dialectOptions: {
      charset: 'utf8mb4',
    },
  },
  staging: {
    dialect: 'mysql' as const,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    timezone: '+07:00',
    dialectOptions: {
      charset: 'utf8mb4',
    },
  },
  production: {
    dialect: 'mysql' as const,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    timezone: '+07:00',
    dialectOptions: {
      charset: 'utf8mb4',
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 30000,
    },
  },
};

export default sequelizeConfig;
