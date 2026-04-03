/**
 * ============================================================================
 * PAYMENT CRON SERVICE
 * ============================================================================
 *
 * Service untuk scheduled tasks terkait payment dan OTP.
 * - Expire pending payments yang sudah lewat waktu
 * - Expire OTP yang sudah tidak valid
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';

import { OrderPayment, PaymentStatus } from '../../../database/models';
import { OrderService } from '../../order/services/order.service';

@Injectable()
export class PaymentCronService {
  private readonly logger = new Logger(PaymentCronService.name);

  constructor(
    @InjectModel(OrderPayment)
    private readonly orderPaymentModel: typeof OrderPayment,

    private readonly orderService: OrderService,
  ) {}

  /**
   * ==========================================================================
   * EXPIRE PENDING PAYMENTS CRON
   * ==========================================================================
   * Berjalan setiap 15 menit untuk mengecek dan expire payment yang pending.
   */
  @Cron('0 */15 * * * *')  // Every 15 minutes
  async handleExpiredPayments(): Promise<void> {
    try {
      this.logger.log('🔄 Checking for expired payments...');

      const expiredCount = await this.orderService.updateExpiredPayments();

      if (expiredCount > 0) {
        this.logger.log(`✅ Expired ${expiredCount} pending payments`);
      }
    } catch (error) {
      this.logger.error(`Failed to expire payments: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * EXPIRE OTP CRON
   * ==========================================================================
   * Berjalan setiap jam untuk mengecek dan expire OTP yang sudah tidak valid.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredOtps(): Promise<void> {
    try {
      this.logger.log('🔄 Checking for expired OTPs...');

      const expiredCount = await this.orderService.updateExpiredOtps();

      if (expiredCount > 0) {
        this.logger.log(`✅ Expired ${expiredCount} OTPs`);
      }
    } catch (error) {
      this.logger.error(`Failed to expire OTPs: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * SYNC PAYMENT STATUS WITH XENDIT
   * ==========================================================================
   * Berjalan setiap 30 menit untuk sync status payment dengan Xendit.
   * Ini sebagai backup jika webhook tidak terkirim.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncPaymentStatus(): Promise<void> {
    try {
      this.logger.log('🔄 Syncing payment status with Xendit...');

      // Get pending payments that are close to expiry
      const pendingPayments = await this.orderPaymentModel.findAll({
        where: {
          status: PaymentStatus.PENDING,
        },
        limit: 50, // Process in batches
      });

      if (pendingPayments.length === 0) {
        return;
      }

      this.logger.log(`Found ${pendingPayments.length} pending payments to sync`);

      // Note: In production, you might want to check with Xendit API
      // But since we already have webhook and expiry cron, this is optional
      // and mainly serves as a backup mechanism.

      // For now, we just check if they've expired based on our local expiry_date
      const now = new Date();
      let expiredCount = 0;

      for (const payment of pendingPayments) {
        if (payment.expiry_date && new Date(payment.expiry_date) < now) {
          await payment.update({ status: PaymentStatus.EXPIRED });
          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        this.logger.log(`Synced ${expiredCount} expired payments`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync payment status: ${(error as Error).message}`);
    }
  }
}
