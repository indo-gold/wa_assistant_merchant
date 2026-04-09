/**
 * ============================================================================
 * PAYMENT EXPIRED CRON SERVICE
 * ============================================================================
 * 
 * Service untuk menangani orders yang payment-nya expired.
 * - Cek orders dengan payment pending yang sudah lewat 3 jam
 * - Update order status ke FAILED
 * - Update cart status ke CANCELLED
 * - Notifikasi user (opsional, karena Xendit juga kirim webhook)
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Order, OrderPayment, PaymentStatus, Cart, CartStatus } from '../../../database/models';
import { OrderService } from '../../order/services/order.service';

@Injectable()
export class PaymentExpiredCronService {
  private readonly logger = new Logger(PaymentExpiredCronService.name);

  constructor(
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
    @InjectModel(OrderPayment)
    private readonly orderPaymentModel: typeof OrderPayment,
    @InjectModel(Cart)
    private readonly cartModel: typeof Cart,
    private readonly orderService: OrderService,
  ) {}

  /**
   * ==========================================================================
   * CHECK EXPIRED PAYMENTS CRON
   * ==========================================================================
   * Berjalan setiap 30 menit untuk cek orders yang payment-nya expired.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron(): Promise<void> {
    this.logger.log('🔄 Checking for expired payments...');
    await this.processExpiredPayments();
  }

  /**
   * ==========================================================================
   * PROCESS EXPIRED PAYMENTS
   * ==========================================================================
   * Cek dan proses orders yang payment-nya sudah expired (> 3 jam).
   * Ini adalah fallback jika webhook Xendit tidak terkirim.
   */
  async processExpiredPayments(): Promise<void> {
    try {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

      // Cari orders yang:
      // 1. Payment status masih pending
      // 2. Order created lebih dari 3 jam yang lalu
      // 3. Belum di-cancel
      const expiredOrders = await this.orderModel.findAll({
        where: {
          payment_status: 'pending',
          created_at: {
            [Op.lt]: threeHoursAgo,
          },
          cancelled_at: null, // Belum di-cancel
        },
        include: [
          {
            model: OrderPayment,
            where: {
              status: PaymentStatus.PENDING,
            },
            required: true,
          },
        ],
      });

      if (expiredOrders.length === 0) {
        this.logger.log('No expired payments found');
        return;
      }

      this.logger.log(`Found ${expiredOrders.length} expired orders to process`);

      // Process setiap expired order
      for (const order of expiredOrders) {
        try {
          if (order.payment?.xendit_invoice_id) {
            // Gunakan OrderService untuk proses expiry
            await this.orderService.processPaymentExpired(
              order.payment.xendit_invoice_id,
              {
                reason: 'Cron job: Payment expired after 3 hours',
                processed_at: new Date().toISOString(),
              }
            );
          } else {
            // Fallback: Update manual jika tidak ada xendit_invoice_id
            await this.manualExpireOrder(order);
          }

          this.logger.log(`Processed expired order: ${order.id}`);
        } catch (error) {
          this.logger.error(`Failed to process expired order ${order.id}: ${(error as Error).message}`);
        }
      }

      this.logger.log(`✅ Processed ${expiredOrders.length} expired orders`);
    } catch (error) {
      this.logger.error(`Process expired payments error: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * MANUAL EXPIRE ORDER
   * ==========================================================================
   * Fallback method untuk expire order jika tidak ada xendit_invoice_id.
   */
  private async manualExpireOrder(order: Order): Promise<void> {
    try {
      // Update order
      await order.update({
        payment_status: 'failed',
        cancelled_at: new Date(),
        cancellation_reason: 'Payment expired (cron fallback)',
      });

      // Update cart
      await this.cartModel.update(
        { status_order: CartStatus.CANCELLED },
        { where: { id: order.cart_id } }
      );

      // Update payment jika ada
      if (order.payment_id) {
        await this.orderPaymentModel.update(
          { status: PaymentStatus.EXPIRED },
          { where: { id: order.payment_id } }
        );
      }

      this.logger.log(`Manually expired order: ${order.id}`);
    } catch (error) {
      this.logger.error(`Manual expire error for order ${order.id}: ${(error as Error).message}`);
      throw error;
    }
  }
}
