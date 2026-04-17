/**
 * ============================================================================
 * REMINDER PRODUCT SERVICE
 * ============================================================================
 * 
 * Service untuk reminder produk yang tersedia kembali.
 * Cron job berjalan setiap jam.
 * 
 * Kriteria:
 * - User request reminder untuk produk yang out of stock
 * - Produk sekarang tersedia (stok > 0)
 * - Belum pernah di-follow-up
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';

import { MessageRole, MessageType, Product, ReminderProducts, User } from '../../../database/models';
import { WhatsappApiService } from '../../whatsapp/services/whatsapp-api.service';
import { ChatService } from '../../chat/services/chat.service';
import { Op } from 'sequelize';

@Injectable()
export class ReminderProductService {
  private readonly logger = new Logger(ReminderProductService.name);

  constructor(

    @InjectModel(ReminderProducts)
    private readonly reminderModel: typeof ReminderProducts,

    private readonly whatsappApi: WhatsappApiService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * ==========================================================================
   * REMINDER PRODUCT CRON
   * ==========================================================================
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    this.logger.log('🔄 Running reminder product cron job...');
    await this.processReminderProducts();
  }

  /**
   * ==========================================================================
   * PROCESS REMINDER PRODUCTS
   * ==========================================================================
   */
  async processReminderProducts(): Promise<void> {
    try {
      // Query reminder products yang belum followup dan produknya sekarang tersedia
      const reminders = await this.reminderModel.findAll({
        where: {
          followup: { [Op.is]: null },
        },
        include: [
          {
            model: User,
            required: true,
          },
          {
            model: Product,
            required: true,
            where: {
              max_quantity: { [Op.gt]: 0 },
            },
          },
        ],
      });

      if (!reminders || reminders.length === 0) {
        this.logger.log('No reminder products need follow-up');
        return;
      }

      this.logger.log(`Processing ${reminders.length} reminder products`);

      // Process reminders
      for (const reminder of reminders) {
        await this.sendReminderMessage(reminder);
      }

      this.logger.log(`✅ Reminder product completed`);
    } catch (error) {
      this.logger.error(`Reminder product error: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * SEND REMINDER MESSAGE
   * ==========================================================================
   */
  private async sendReminderMessage(reminder: ReminderProducts): Promise<void> {
    try {
      const user = reminder.user;
      const product = reminder.product;

      if (!user?.phone_number || !product) {
        this.logger.warn(`Skipping reminder ${reminder.id}: missing user, phone_number, or product data`);
        return;
      }

      const productList = reminder.product_name + ' ' + (reminder.variant_name || '') + ' ' + reminder.denomination + 'gr';
      const priceFormatted = 'Rp ' + product.price.toLocaleString('id-ID');

      const message = `Hai Kak 👋!

Kami ingin menginformasikan bahwa produk berikut sudah tersedia:
${productList} - ${priceFormatted}

Jika butuh bantuan untuk pemesanan, bisa info kami kembali ya 😊

Terima kasih!`;

      const response = await this.whatsappApi.sendMessage({
        type: 'reply_context',
        to: user.phone_number,
        data: {
          text: message,
          reply_message_id: reminder.wa_message_id,
        },
      });

      // Mark followup segera setelah WA send berhasil agar tidak di-retry/double send
      await reminder.update({ followup: new Date() });

      // Save to chat history (best effort — jika gagal, pesan tetap terkirim)
      try {
        await this.chatService.saveMessage({
          user_id: reminder.user_id,
          wa_message_id: response.messages[0]?.id,
          message,
          role: MessageRole.ASSISTANT,
          type: MessageType.TEXT,
        });
      } catch (saveError) {
        this.logger.warn(`Failed to save reminder chat history: ${(saveError as Error).message}`);
      }

      this.logger.log(`Reminder sent to ${user.phone_number} for ${productList}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reminder: ${(error as Error).message}`,
      );
    }
  }
}
