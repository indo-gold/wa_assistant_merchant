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
    
    // 1. Auto-expire carts yang sudah lewat batas waktu
    await this.autoExpireCarts();
    
    // 2. Kirim follow-up untuk carts yang pending
    await this.processFollowupCarts();
  }

  /**
   * ==========================================================================
   * AUTO EXPIRE CARTS
   * ==========================================================================
   * Tandai cart yang sudah expired (melebihi 5 menit) sebagai expired.
   */
  private async autoExpireCarts(): Promise<void> {
    try {
      const expiredCarts = await this.cartModel.findAll({
        where: {
          status_order: CartStatus.PENDING,
          expires_at: {
            [Op.lt]: new Date(),
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

      if (expiredCarts.length === 0) {
        return;
      }

      this.logger.log(`Found ${expiredCarts.length} expired carts to process`);

      for (const cart of expiredCarts) {
        try {
          // Update status ke EXPIRED
          await cart.update({ status_order: CartStatus.EXPIRED });

          // Kirim notifikasi ke user
          const expireMessage = 
            `⏰ *Keranjang Expired*\n\n` +
            `Keranjang pesanan Anda telah expired karena melebihi batas waktu 5 menit.\n\n` +
            `Silakan buat pesanan baru jika masih ingin membeli. Harga yang berlaku adalah harga terkini.`;

          await this.whatsappApi.sendMessage({
            type: 'text',
            to: cart.user.phone_number,
            data: { text: expireMessage },
          });

          // Simpan ke chat history
          await this.chatService.saveMessage({
            user_id: cart.user.id,
            message: expireMessage,
            role: MessageRole.ASSISTANT,
            type: MessageType.TEXT,
          });

          this.logger.log(`Cart ${cart.id} marked as expired and user notified`);
        } catch (error) {
          this.logger.error(`Failed to process expired cart ${cart.id}: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Auto expire carts error: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * PROCESS FOLLOW-UP CARTS
   * ==========================================================================
   * Follow up carts yang sudah 2 menit tapi belum checkout.
   */
  async processFollowupCarts(): Promise<void> {
    try {
      const startTime = new Date(Date.now() - 3 * 60 * 1000); // 3 menit lalu
      const endTime = new Date(Date.now() - 2 * 60 * 1000);   // 2 menit lalu

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
      if (!cart.User?.phone_number) {
        this.logger.warn(`Cart ${cart.id} has no user or phone number, skipping follow-up`);
        return;
      }

      const text = `⏰ *Segera Checkout*\n\nHalo Kak 👋, pesanan Anda masih menunggu. Keranjang akan expired dalam 3 menit.\n\nSilakan konfirmasi *Lanjut* untuk mengamankan harga, ya.`;

      const response = await this.whatsappApi.sendMessage({
        type: 'reply_context',
        to: cart.User.phone_number,
        data: {
          text,
          reply_message_id: cart.wa_message_id,
        },
      });

      // Mark follow_up segera setelah WA send berhasil
      await this.cartModel.update(
        { follow_up: new Date() },
        { where: { id: cart.id } },
      );

      // Save to chat history (best effort)
      try {
        await this.chatService.saveMessage({
          user_id: cart.User.id,
          wa_message_id: response.messages[0]?.id,
          message: text,
          role: MessageRole.ASSISTANT,
          type: MessageType.TEXT,
        });
      } catch (saveError) {
        this.logger.warn(`Failed to save cart follow-up chat history: ${(saveError as Error).message}`);
      }

      this.logger.log(`Follow-up sent to ${cart.User?.phone_number}`);
    } catch (error) {
      this.logger.error(
        `Failed to send follow-up for cart ${cart.id}: ${(error as Error).message}`,
      );
    }
  }
}
