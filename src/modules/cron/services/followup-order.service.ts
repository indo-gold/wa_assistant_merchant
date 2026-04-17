/**
 * ============================================================================
 * FOLLOW-UP ORDER SERVICE
 * ============================================================================
 * 
 * Service untuk follow-up order yang belum checkout.
 * Cron job berjalan setiap jam.
 * 
 * Kriteria:
 * - Order status = generate_link atau open_link
 * - Belum pernah di-follow-up
 * - Dibuat 2 jam yang lalu
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Order, User, MessageRole, MessageType } from '../../../database/models';
import { WhatsappApiService } from '../../whatsapp/services/whatsapp-api.service';
import { ChatService } from '../../chat/services/chat.service';

@Injectable()
export class FollowupOrderService {
  private readonly logger = new Logger(FollowupOrderService.name);

  constructor(
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
    private readonly whatsappApi: WhatsappApiService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * ==========================================================================
   * FOLLOW-UP ORDER CRON
   * ==========================================================================
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    this.logger.log('🔄 Running follow-up order cron job...');
    await this.processFollowupOrders();
  }

  /**
   * ==========================================================================
   * PROCESS FOLLOW-UP ORDERS
   * ==========================================================================
   */
  async processFollowupOrders(): Promise<void> {
    try {
      const startTime = new Date(Date.now() - 2.5 * 60 * 60 * 1000); // 2.5 jam lalu
      const endTime = new Date(Date.now() - 2 * 60 * 60 * 1000);     // 2 jam lalu

      const orders = await this.orderModel.findAll({
        where: {
          payment_status: 'pending',
          follow_up: null,
          created_at: {
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

      if (orders.length === 0) {
        this.logger.log('No orders need follow-up');
        return;
      }

      this.logger.log(`Processing ${orders.length} orders for follow-up`);

      // Process dalam batch
      const batchSize = 5;
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map((order) => this.sendFollowupMessage(order)),
        );
      }

      this.logger.log(`✅ Follow-up order completed`);
    } catch (error) {
      this.logger.error(`Follow-up order error: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * SEND FOLLOW-UP MESSAGE
   * ==========================================================================
   */
  private async sendFollowupMessage(order: Order & { User?: User }): Promise<void> {
    try {
      if (!order.User?.phone_number) {
        this.logger.warn(`Order ${order.id} has no user or phone number, skipping follow-up`);
        return;
      }

      const text = `Hai Kak 👋, kami lihat Kakak belum menyelesaikan pesanan di keranjang.
Yuk lanjutkan proses checkout sekarang biar pesanan Kakak bisa segera kami siapkan 😊

Kalau ada yang ingin ditanyakan sebelum checkout, boleh banget chat kami di sini ya 💬`;

      const response = await this.whatsappApi.sendMessage({
        type: 'reply_context',
        to: order.User.phone_number,
        data: {
          text,
          reply_message_id: order.wa_message_id,
        },
      });

      // Mark follow_up segera setelah WA send berhasil
      await this.orderModel.update(
        { follow_up: new Date() },
        { where: { id: order.id } },
      );

      // Save to chat history (best effort)
      try {
        await this.chatService.saveMessage({
          user_id: order.User.id,
          wa_message_id: response.messages[0]?.id,
          message: text,
          role: MessageRole.ASSISTANT,
          type: MessageType.TEXT,
        });
      } catch (saveError) {
        this.logger.warn(`Failed to save order follow-up chat history: ${(saveError as Error).message}`);
      }

      this.logger.log(`Follow-up sent to ${order.User?.phone_number}`);
    } catch (error) {
      this.logger.error(
        `Failed to send follow-up for order ${order.id}: ${(error as Error).message}`,
      );
    }
  }
}
