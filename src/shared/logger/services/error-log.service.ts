/**
 * ============================================================================
 * ERROR LOG SERVICE
 * ============================================================================
 * 
 * Service untuk logging errors ke database.
 * - Log application errors
 * - Query error history
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ErrorLog } from '../../../database/models';

@Injectable()
export class ErrorLogService {
  private readonly logger = new Logger(ErrorLogService.name);

  constructor(
    @InjectModel(ErrorLog)
    private readonly errorLogModel: typeof ErrorLog,
  ) {}

  /**
   * ==========================================================================
   * LOG ERROR
   * ==========================================================================
   * Log error ke database.
   */
  async logError(error: Error | string, context?: string): Promise<ErrorLog> {
    try {
      const errorMessage = error instanceof Error 
        ? `${context ? `[${context}] ` : ''}${error.message}\n${error.stack}`
        : `${context ? `[${context}] ` : ''}${error}`;

      const log = await this.errorLogModel.create({
        error: errorMessage,
        timestamp: new Date(),
      });

      this.logger.log(`Error logged: ${log.id}`);
      return log;
    } catch (err) {
      this.logger.error(`Failed to log error: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * ==========================================================================
   * LOG ERROR SYNC
   * ==========================================================================
   * Log error tanpa await (fire and forget).
   */
  logErrorSync(error: Error | string, context?: string): void {
    this.logError(error, context).catch((err) => {
      this.logger.error(`Failed to log error: ${err.message}`);
    });
  }

  /**
   * ==========================================================================
   * GET RECENT ERRORS
   * ==========================================================================
   * Get recent error logs.
   */
  async getRecentErrors(limit: number = 50): Promise<ErrorLog[]> {
    return this.errorLogModel.findAll({
      order: [['timestamp', 'DESC']],
      limit,
    });
  }

  /**
   * ==========================================================================
   * GET ERRORS BY DATE RANGE
   * ==========================================================================
   * Get errors within date range.
   */
  async getErrorsByDateRange(
    startDate: Date, 
    endDate: Date,
  ): Promise<ErrorLog[]> {
    return this.errorLogModel.findAll({
      where: {
        timestamp: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['timestamp', 'DESC']],
    });
  }

  /**
   * ==========================================================================
   * CLEAR OLD ERRORS
   * ==========================================================================
   * Delete error logs older than specified days.
   */
  async clearOldErrors(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deleted = await this.errorLogModel.destroy({
      where: {
        timestamp: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    this.logger.log(`Cleared ${deleted} old error logs`);
    return deleted;
  }
}
