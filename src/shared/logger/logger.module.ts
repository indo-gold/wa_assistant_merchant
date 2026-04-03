/**
 * ============================================================================
 * LOGGER SHARED MODULE
 * ============================================================================
 * 
 * Module untuk shared logger functionality.
 * Menyediakan custom logger service yang bisa di-inject di seluruh aplikasi.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Global, Module } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SequelizeModule } from '@nestjs/sequelize';
import { ErrorLog } from '../../database/models';
import { ErrorLogService } from './services/error-log.service';

/**
 * ============================================================================
 * CUSTOM LOGGER SERVICE
 * ============================================================================
 * Wrapper service untuk Pino logger dengan additional methods
 */
@Global() // Global module sehingga tidak perlu import di setiap module
@Module({
  imports: [SequelizeModule.forFeature([ErrorLog])],
  providers: [Logger, ErrorLogService],
  exports: [Logger, ErrorLogService],
})
export class LoggerSharedModule {}
