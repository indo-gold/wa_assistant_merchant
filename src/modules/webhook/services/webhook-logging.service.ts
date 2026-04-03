/**
 * ============================================================================
 * WEBHOOK LOGGING SERVICE
 * ============================================================================
 *
 * Service untuk logging webhook requests.
 * - Log webhook payloads
 * - Track webhook nonces (duplicate prevention)
 * - Query webhook history
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { WebhookRequest } from '../../../database/models';

export interface LogWebhookRequestDto {
  nonce?: string;
}

@Injectable()
export class WebhookLoggingService {
  private readonly logger = new Logger(WebhookLoggingService.name);

  constructor(
    @InjectModel(WebhookRequest)
    private readonly webhookRequestModel: typeof WebhookRequest,
  ) {}

  /**
   * ==========================================================================
   * LOG WEBHOOK REQUEST (NONCE)
   * ==========================================================================
   * Log webhook request dengan nonce (untuk duplicate detection).
   */
  async logWebhookRequest(dto: LogWebhookRequestDto): Promise<WebhookRequest> {
    try {
      const log = await this.webhookRequestModel.create({
        nonce: dto.nonce,
        timestamp: new Date(),
      });

      this.logger.log(`Webhook request logged: ${log.id}, nonce: ${dto.nonce}`);
      return log;
    } catch (error) {
      this.logger.error(`Error logging webhook request: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * CHECK NONCE EXISTS
   * ==========================================================================
   * Check apakah nonce sudah pernah digunakan (duplicate prevention).
   */
  async checkNonceExists(nonce: string): Promise<boolean> {
    const count = await this.webhookRequestModel.count({
      where: { nonce },
    });
    return count > 0;
  }

  /**
   * ==========================================================================
   * GET RECENT WEBHOOK REQUESTS
   * ==========================================================================
   * Get recent webhook requests.
   */
  async getRecentWebhookRequests(limit: number = 50): Promise<WebhookRequest[]> {
    return this.webhookRequestModel.findAll({
      order: [['timestamp', 'DESC']],
      limit,
    });
  }
}
