/**
 * ============================================================================
 * FOLLOW-UP CART SERVICE
 * ============================================================================
 * 
 * Service untuk follow-up cart yang pending.
 * Cron job berjalan setiap jam untuk mengirim reminder.
 * 
 * Kriteria:
 * - Cart status = pending
 * - Belum pernah di-follow-up
 * - Dibuat 4 jam yang lalu
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Cart, User, CartStatus, MessageRole, MessageType } from '../../../database/models';
import { WhatsappApiService } from '../../whatsapp/services/whatsapp-api.service';
import { ChatService } from '../../chat/services/chat.service';

@Injectable()
export class FollowupCartService {
  private readonly logger = new Logger(FollowupCartService.name);

  constructor(
    @InjectModel(Cart)
    private readonly cartModel: typeof Cart,
    private readonly whatsappApi: WhatsappApiService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * ==========================================================================
   * FOLLOW-UP CART CRON
   * ==========================================================================
   * Berjalan setiap jam.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    this.logger.log('🔄 Running follow-up cart cron job...');
    await this.processFollowupCarts();
  }

  /**
   * ==========================================================================
   * PROCESS FOLLOW-UP CARTS
   * ==========================================================================
   */
  async processFollowupCarts(): Promise<void> {
    try {
      const startTime = new Date(Date.now() - 4.5 * 60 * 60 * 1000); // 4.5 jam lalu
      const endTime = new Date(Date.now() - 4 * 60 * 60 * 1000);     // 4 jam lalu

      const carts = await this.cartModel.findAll({
        where: {
          status_order: CartStatus.PENDING,
          follow_up: null,
          timestamp: {
            [Op.gte]: startTime,
            [Op.lte]: endTime,
          },
        },
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'phone_number'],
            required: true,
          },
        ],
      });

      if (carts.length === 0) {
        this.logger.log('No carts need follow-up');
        return;
      }

      this.logger.log(`Processing ${carts.length} carts for follow-up`);

      // Process dalam batch (max 5 per batch)
      const batchSize = 5;
      for (let i = 0; i < carts.length; i += batchSize) {
        const batch = carts.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map((cart) => this.sendFollowupMessage(cart)),
        );
      }

      this.logger.log(`✅ Follow-up cart completed`);
    } catch (error) {
      this.logger.error(`Follow-up cart error: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * SEND FOLLOW-UP MESSAGE
   * ==========================================================================
   */
  private async sendFollowupMessage(cart: Cart & { User?: User }): Promise<void> {
    try {
      const text = `Halo Kak 👋, jika ingin menindaklanjuti pesanan sebelumnya, mohon konfirmasi kembali rincian pesanannya agar bisa segera kami proses, ya.`;

      const response = await this.whatsappApi.sendMessage({
        type: 'reply_context',
        to: cart.User.phone_number,
        data: {
          text,
          reply_message_id: cart.wa_message_id,
        },
      });

      // Save to chat history
      await this.chatService.saveMessage({
        user_id: cart.User.id,
        wa_message_id: response.messages[0]?.id,
        message: text,
        role: MessageRole.ASSISTANT,
        type: MessageType.TEXT,
      });

      // Update cart follow_up
      await this.cartModel.update(
        { follow_up: Math.floor(Date.now() / 1000) },
        { where: { id: cart.id } },
      );

      this.logger.log(`Follow-up sent to ${cart.User.phone_number}`);
    } catch (error) {
      this.logger.error(
        `Failed to send follow-up to ${cart.User.phone_number}: ${(error as Error).message}`,
      );
    }
  }
}
