import { InjectModel, InjectConnection } from '@nestjs/sequelize';
/**
 * ============================================================================
 * ORDER SERVICE
 * ============================================================================
 *
 * Service untuk order management dengan Xendit Payment Integration.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Injectable, Logger } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';

import {
  Order,
  PickupStatus,
  Cart,
  CartStatus,
  GeneralVariables,
  OrderPayment,
  PaymentStatus,
  OrderOtp,
  OtpStatus,
  OtpPurpose,
} from '../../../database/models';

export interface OrderConfirmationResult {
  success: boolean;
  orderId?: number;
  paymentId?: number;
  invoiceUrl?: string;
  message?: string;
}

export interface OtpVerificationResult {
  success: boolean;
  message: string;
}

export interface CreateOrderWithPaymentLinkParams {
  cartId: number;
  userId: number;
  xenditInvoiceId: string;
  externalId: string;
  amount: number;
  invoiceUrl: string;
  expiryDate: Date;
  items: Array<{ name: string; quantity: number; price: number }>;

  // Platform fee fields (NEW)
  feeType: string; // 'percent' | 'flat'
  platformFeeAmount: number;
  merchantAmount: number; // Amount sebelum fee
  feePercent?: number; // Untuk history
  feeFlat?: number; // Untuk history
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: number;
  paymentId?: number;
  message?: string;
}

export interface ProcessPaymentSuccessResult {
  success: boolean;
  orderId?: number;
  otpCode?: string;
  message?: string;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
    @InjectModel(Cart)
    private readonly cartModel: typeof Cart,
    @InjectModel(OrderPayment)
    private readonly orderPaymentModel: typeof OrderPayment,
    @InjectModel(OrderOtp)
    private readonly orderOtpModel: typeof OrderOtp,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * ==========================================================================
   * GENERATE OTP
   * ==========================================================================
   * Generate kode OTP untuk verifikasi pengambilan.
   * - Cek OTP aktif yang sudah ada untuk order ini (hindari double)
   * - Generate OTP unik yang tidak bentrok dengan OTP aktif lain
   */
  async generateOtp(orderId: number, userId: number, paymentId: number): Promise<OrderOtp> {
    // 1. Cek apakah sudah ada OTP aktif untuk order ini
    const existingOtp = await this.orderOtpModel.findOne({
      where: {
        order_id: orderId,
        payment_id: paymentId,
        status: OtpStatus.ACTIVE,
      },
    });

    if (existingOtp) {
      this.logger.log(`Using existing active OTP for order ${orderId}: ${existingOtp.otp_code}`);
      return existingOtp;
    }

    // 2. Generate OTP unik (tidak bentrok dengan OTP aktif lain)
    const otpCode = await this.generateUniqueOtpCode();

    // 3. Get expiry hours dari config
    const otpExpiryHours = parseInt(await this.getGeneralVariable('otp_expiry_hours', '24'), 10);
    const expiresAt = new Date(Date.now() + otpExpiryHours * 60 * 60 * 1000);

    this.logger.log(`Generated new OTP for order ${orderId}: ${otpCode}`);

    return this.orderOtpModel.create({
      order_id: orderId,
      user_id: userId,
      payment_id: paymentId,
      otp_code: otpCode,
      purpose: OtpPurpose.PICKUP_VERIFICATION,
      status: OtpStatus.ACTIVE,
      expires_at: expiresAt,
    });
  }

  /**
   * ==========================================================================
   * GENERATE UNIQUE OTP CODE
   * ==========================================================================
   * Generate kode OTP yang unik (tidak ada di database dengan status ACTIVE)
   */
  private async generateUniqueOtpCode(): Promise<string> {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate 6 digit random code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Cek apakah kode ini sudah dipakai oleh OTP aktif lain
      const existing = await this.orderOtpModel.findOne({
        where: {
          otp_code: otpCode,
          status: OtpStatus.ACTIVE,
        },
      });

      // Jika tidak ada yang pakai, return kode ini
      if (!existing) {
        return otpCode;
      }

      this.logger.warn(
        `OTP code ${otpCode} collision detected, retrying... (${attempt + 1}/${maxAttempts})`,
      );
    }

    // Fallback: tambahkan timestamp untuk uniqueness (sangat jarang terjadi)
    const timestamp = Date.now().toString().slice(-3);
    const prefix = Math.floor(100 + Math.random() * 900).toString();
    return prefix + timestamp;
  }

  /**
   * ==========================================================================
   * GET ORDER BY ID
   * ==========================================================================
   */
  async getOrderById(orderId: number): Promise<Order | null> {
    return this.orderModel.findByPk(orderId, {
      include: ['user', 'payment', 'orderOtp'],
    });
  }

  /**
   * ==========================================================================
   * GET ORDER BY PAYMENT ID
   * ==========================================================================
   */
  async getOrderByPaymentId(paymentId: number): Promise<Order | null> {
    return this.orderModel.findOne({
      where: { payment_id: paymentId },
    });
  }

  /**
   * ==========================================================================
   * FORMAT SUCCESS PAYMENT MESSAGE WITH OTP
   * ==========================================================================
   * Format pesan sukses pembayaran dengan kode OTP
   */
  formatSuccessMessageWithOtp(otpCode: string, expiryHours: number): string {
    const expiryTime = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const formattedExpiry = expiryTime.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      `🎉 *Pembayaran Berhasil!*\n\n` +
      `Terima kasih atas pembayaran Anda.\n\n` +
      `*Kode Verifikasi Pengambilan:*\n` +
      `\`${otpCode}\`\n\n` +
      `*Berlaku sampai:* ${formattedExpiry}\n\n` +
      `Mohon tunjukkan kode ini saat mengambil pesanan di toko.\n` +
      `Jangan bagikan kode ini kepada siapapun!\n\n` +
      `Jika ada pertanyaan, silakan hubungi customer service kami.`
    );
  }

  /**
   * ==========================================================================
   * GET PENDING PAYMENTS
   * ==========================================================================
   * Ambil payment yang masih pending dan sudah expired
   */
  async getExpiredPendingPayments(): Promise<OrderPayment[]> {
    return this.orderPaymentModel.findAll({
      where: {
        status: PaymentStatus.PENDING,
        expiry_date: {
          [Op.lt]: new Date(),
        },
      },
    });
  }

  /**
   * ==========================================================================
   * UPDATE EXPIRED PAYMENTS
   * ==========================================================================
   */
  async updateExpiredPayments(): Promise<number> {
    const [updatedCount] = await this.orderPaymentModel.update(
      { status: PaymentStatus.EXPIRED },
      {
        where: {
          status: PaymentStatus.PENDING,
          expiry_date: {
            [Op.lt]: new Date(),
          },
        },
      },
    );

    if (updatedCount > 0) {
      this.logger.log(`Updated ${updatedCount} expired payments`);
    }

    return updatedCount;
  }

  /**
   * ==========================================================================
   * UPDATE PAYMENT EXPIRED BY XENDIT ID
   * ==========================================================================
   * Update payment status ke expired berdasarkan Xendit Invoice ID
   */
  async updatePaymentExpired(
    xenditInvoiceId: string,
    payload?: Record<string, unknown>,
  ): Promise<{ success: boolean; userId?: number; message?: string }> {
    try {
      const payment = await this.orderPaymentModel.findOne({
        where: { xendit_invoice_id: xenditInvoiceId },
      });

      if (!payment) {
        this.logger.warn(`Payment not found for expired invoice: ${xenditInvoiceId}`);
        return { success: false, message: 'Payment not found' };
      }

      if (payment.status === PaymentStatus.EXPIRED || payment.status === PaymentStatus.PAID) {
        return { success: true, userId: payment.user_id, message: 'Already in final status' };
      }

      await payment.update({
        status: PaymentStatus.EXPIRED,
        xendit_callback_payload: payload || payment.xendit_callback_payload,
      });

      // Update order status juga
      if (payment.order_id) {
        await this.orderModel.update(
          { payment_status: 'expired' },
          { where: { id: payment.order_id } },
        );
      }

      this.logger.log(`Payment marked as expired: ${xenditInvoiceId}`);
      return { success: true, userId: payment.user_id, message: 'Payment expired updated' };
    } catch (error) {
      this.logger.error(`Failed to update expired payment: ${(error as Error).message}`);
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * ==========================================================================
   * UPDATE EXPIRED OTPS
   * ==========================================================================
   */
  async updateExpiredOtps(): Promise<number> {
    const [updatedCount] = await this.orderOtpModel.update(
      { status: OtpStatus.EXPIRED },
      {
        where: {
          status: OtpStatus.ACTIVE,
          expires_at: {
            [Op.lt]: new Date(),
          },
        },
      },
    );

    if (updatedCount > 0) {
      this.logger.log(`Updated ${updatedCount} expired OTPs`);
    }

    return updatedCount;
  }

  /**
   * Get general variable value
   */
  private async getGeneralVariable(variable: string, defaultValue: string): Promise<string> {
    try {
      // Import GeneralVariables model dynamically to avoid circular dependency

      const record = await GeneralVariables.findOne({
        where: { variable },
      });
      return record?.value || defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * ==========================================================================
   * CREATE ORDER WITH PAYMENT LINK
   * ==========================================================================
   * Membuat order dan payment record dengan Payment Link Xendit
   */
  async createOrderWithPaymentLink(
    params: CreateOrderWithPaymentLinkParams,
  ): Promise<CreateOrderResult> {
    const transaction = await this.sequelize.transaction();

    try {
      // 1. Buat Order record (status pending, menunggu pembayaran)
      const order = await this.orderModel.create(
        {
          cart_id: params.cartId,
          user_id: params.userId,
          link_invoice: params.invoiceUrl,
          payment_status: 'pending',
          pickup_status: PickupStatus.PENDING,
        },
        { transaction },
      );

      // 2. Buat OrderPayment record
      const paymentData: any = {
        order_id: order.id,
        cart_id: params.cartId,
        user_id: params.userId,
        xendit_invoice_id: params.xenditInvoiceId,
        xendit_external_id: params.externalId,
        amount: params.amount,
        currency: 'IDR',
        status: PaymentStatus.PENDING,
        invoice_url: params.invoiceUrl,
        expiry_date: params.expiryDate,
        fee_type: params.feeType,
        platform_fee_amount: params.platformFeeAmount,
        merchant_amount: params.merchantAmount,
        fee_percent: params.feePercent || null,
        fee_flat: params.feeFlat || null,
        payment_details: {
          items: params.items,
          created_via: 'payment_link',
        },
      };

      const payment = await this.orderPaymentModel.create(paymentData, { transaction });

      // 3. Update order dengan payment_id
      await order.update({ payment_id: payment.id }, { transaction });

      await transaction.commit();

      this.logger.log(
        `Order created with payment link: Order ${order.id}, Payment ${payment.id}, Xendit ${params.xenditInvoiceId}`,
      );

      return {
        success: true,
        orderId: order.id,
        paymentId: payment.id,
        message: 'Order dan payment link berhasil dibuat.',
      };
    } catch (error) {
      await transaction.rollback();
      this.logger.error(`Failed to create order with payment link: ${(error as Error).message}`);
      return {
        success: false,
        message: `Gagal membuat order: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * PROCESS PAYMENT SUCCESS
   * ==========================================================================
   * Handler untuk webhook Xendit saat pembayaran berhasil
   */
  async processPaymentSuccess(
    xenditInvoiceId: string,
    payload: Record<string, unknown>,
  ): Promise<ProcessPaymentSuccessResult> {
    const transaction = await this.sequelize.transaction();

    try {
      // 1. Cari payment record berdasarkan Xendit Invoice ID
      const payment = await this.orderPaymentModel.findOne({
        where: { xendit_invoice_id: xenditInvoiceId },
        transaction,
      });

      if (!payment) {
        await transaction.rollback();
        this.logger.warn(`Payment not found for Xendit invoice: ${xenditInvoiceId}`);
        return {
          success: false,
          message: 'Payment record not found.',
        };
      }

      // 2. Cek jika sudah diproses sebelumnya
      if (payment.status === PaymentStatus.PAID) {
        await transaction.rollback();
        this.logger.log(`Payment ${payment.id} already marked as paid`);

        // Ambil order dan OTP yang sudah ada
        const order = await this.orderModel.findOne({
          where: { payment_id: payment.id },
        });
        const otp = await this.orderOtpModel.findOne({
          where: { payment_id: payment.id },
        });

        return {
          success: true,
          orderId: order?.id,
          otpCode: otp?.otp_code,
          message: 'Payment already processed.',
        };
      }

      // 3. Update payment status
      const paidAt = payload.paid_at ? new Date(payload.paid_at as string) : new Date();

      await payment.update(
        {
          status: PaymentStatus.PAID,
          paid_at: paidAt,
          xendit_callback_payload: payload,
          payment_method: payload.payment_method as string | null,
          payment_details: {
            ...payment.payment_details,
            payment_channel: payload.payment_channel,
            paid_amount: payload.paid_amount,
          },
        },
        { transaction },
      );

      // 4. Update order status
      const order = await this.orderModel.findOne({
        where: { id: payment.order_id },
        transaction,
      });

      if (order) {
        await order.update(
          {
            payment_status: 'paid',
            pickup_status: PickupStatus.PENDING,
          },
          { transaction },
        );
      }

      // 5. Generate OTP untuk pengambilan barang
      // Cek dulu apakah sudah ada OTP aktif untuk order ini
      const existingOtp = await this.orderOtpModel.findOne({
        where: {
          order_id: order?.id || payment.order_id,
          payment_id: payment.id,
          status: OtpStatus.ACTIVE,
        },
        transaction,
      });

      let otpCode: string;

      if (existingOtp) {
        otpCode = existingOtp.otp_code;
        this.logger.log(`Using existing OTP for order ${order?.id}: ${otpCode}`);
      } else {
        // Generate OTP unik
        otpCode = await this.generateUniqueOtpCode();

        const otpExpiryHours = parseInt(
          await this.getGeneralVariable('otp_expiry_hours', '24'),
          10,
        );
        const expiresAt = new Date(Date.now() + otpExpiryHours * 60 * 60 * 1000);

        await this.orderOtpModel.create(
          {
            order_id: order?.id || payment.order_id,
            user_id: payment.user_id,
            payment_id: payment.id,
            otp_code: otpCode,
            purpose: OtpPurpose.PICKUP_VERIFICATION,
            status: OtpStatus.ACTIVE,
            expires_at: expiresAt,
          },
          { transaction },
        );

        this.logger.log(`Generated new OTP for order ${order?.id}: ${otpCode}`);
      }

      await transaction.commit();

      return {
        success: true,
        orderId: order?.id,
        otpCode,
        message: 'Payment success processed, OTP generated.',
      };
    } catch (error) {
      await transaction.rollback();
      this.logger.error(`Failed to process payment success: ${(error as Error).message}`);
      return {
        success: false,
        message: `Failed to process payment: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * CANCEL ORDER
   * ==========================================================================
   * Cancel order dan update cart status.
   */
  async cancelOrder(cartId: number): Promise<boolean> {
    try {
      await this.cartModel.update(
        { status_order: CartStatus.CANCELLED },
        { where: { id: cartId } },
      );

      this.logger.log(`Order cancelled for cart: ${cartId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel order: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * ==========================================================================
   * PROCESS PAYMENT EXPIRED
   * ==========================================================================
   * Handler untuk webhook Xendit saat pembayaran expired.
   * - Update payment status ke EXPIRED
   * - Update order status ke FAILED
   * - Update cart status ke CANCELLED
   * - Release stok (jika ada)
   */
  async processPaymentExpired(
    xenditInvoiceId: string,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; orderId?: number; cartId?: number; message?: string }> {
    const transaction = await this.sequelize.transaction();

    try {
      // 1. Cari payment record
      const payment = await this.orderPaymentModel.findOne({
        where: { xendit_invoice_id: xenditInvoiceId },
        transaction,
      });

      if (!payment) {
        await transaction.rollback();
        this.logger.warn(`Payment not found for expired invoice: ${xenditInvoiceId}`);
        return { success: false, message: 'Payment record not found.' };
      }

      // 2. Cek jika sudah diproses sebelumnya
      if (payment.status === PaymentStatus.EXPIRED || payment.status === PaymentStatus.FAILED) {
        await transaction.rollback();
        this.logger.log(`Payment ${payment.id} already marked as expired/failed`);

        // Ambil order info untuk return
        const order = await this.orderModel.findOne({
          where: { payment_id: payment.id },
        });

        return {
          success: true,
          orderId: order?.id,
          cartId: order?.cart_id,
          message: 'Payment already processed as expired.',
        };
      }

      // 3. Update payment status ke EXPIRED
      await payment.update(
        {
          status: PaymentStatus.EXPIRED,
          xendit_callback_payload: payload,
        },
        { transaction },
      );

      // 4. Update order status ke FAILED
      const order = await this.orderModel.findOne({
        where: { payment_id: payment.id },
        transaction,
      });

      if (order) {
        await order.update(
          {
            payment_status: 'failed',
            cancelled_at: new Date(),
            cancellation_reason: 'Payment link expired',
          },
          { transaction },
        );
        this.logger.log(`Order ${order.id} marked as FAILED due to payment expiry`);

        // 5. Update cart status ke CANCELLED
        await this.cartModel.update(
          {
            status_order: CartStatus.CANCELLED,
          },
          {
            where: { id: order.cart_id },
            transaction,
          },
        );
        this.logger.log(`Cart ${order.cart_id} marked as CANCELLED`);

        // 6. TODO: Release stok jika ada sistem stok management
        // await this.releaseStock(order.cart_id);
      }

      await transaction.commit();

      this.logger.log(`Payment ${xenditInvoiceId} processed as expired`);
      return {
        success: true,
        orderId: order?.id,
        cartId: order?.cart_id,
        message: 'Payment expired processed. Order marked as FAILED, Cart marked as CANCELLED.',
      };
    } catch (error) {
      await transaction.rollback();
      this.logger.error(`Failed to process payment expiry: ${(error as Error).message}`);
      return {
        success: false,
        message: `Failed to process payment expiry: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * UPDATE ORDER STATUS
   * ==========================================================================
   */
  async updateOrderStatus(invoiceId: string, _status: string): Promise<boolean> {
    // Status column removed - using payment_status instead
    this.logger.warn(`updateOrderStatus called but status column removed: ${invoiceId}`);
    return true;
  }

  /**
   * ==========================================================================
   * GET ORDER BY INVOICE LINK
   * ==========================================================================
   */
  async getOrderByInvoiceLink(invoiceLink: string): Promise<Order | null> {
    return this.orderModel.findOne({
      where: { link_invoice: invoiceLink },
    });
  }

  /**
   * ==========================================================================
   * GET ORDERS FOR FOLLOW UP
   * ==========================================================================
   * Get orders yang perlu di-follow up (belum checkout setelah 2 jam).
   */
  async getOrdersForFollowUp(hoursAgo: number = 2): Promise<Order[]> {
    const startTime = new Date(Date.now() - (hoursAgo + 0.5) * 60 * 60 * 1000);
    const endTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    return this.orderModel.findAll({
      where: {
        payment_status: 'pending',
        follow_up: null,
        created_at: {
          [Op.between]: [startTime, endTime],
        },
      },
      include: ['user'],
    });
  }

  /**
   * ==========================================================================
   * GENERATE ORDER NUMBER
   * ==========================================================================
   * Generate nomor order unik.
   */
  async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const todayStr = `${year}-${month}-${day}`;

    const countToday = await this.orderModel.count({
      where: {
        [Op.and]: [Sequelize.where(Sequelize.fn('DATE', Sequelize.col('created_at')), todayStr)],
      },
    });

    const orderPrefix = `ORD${year}${month}${day}`;
    const orderNumber = String(countToday + 1).padStart(4, '0');

    return `${orderPrefix}${orderNumber}`;
  }
}
