/**
 * ============================================================================
 * XENDIT WEBHOOK CONTROLLER
 * ============================================================================
 *
 * Controller untuk handle webhook dari Xendit Payment.
 *
 * Endpoints:
 * - POST /webhook/xendit : Receive payment callback dari Xendit
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { SkipThrottle } from '../../../common/decorators/skip-throttle.decorator';
import { OrderService } from '../../order/services/order.service';
import { XenditService } from '../../order/services/xendit.service';
import { WhatsappApiService } from '../../whatsapp/services/whatsapp-api.service';
import { ChatService } from '../../chat/services/chat.service';
import { MessageRole, MessageType } from '../../../database/models';

interface XenditWebhookPayload {
  id: string;
  external_id: string;
  user_id: string;
  is_high: boolean;
  payment_method: string;
  status: 'PAID' | 'SETTLED' | 'EXPIRED' | 'PENDING';
  merchant_name: string;
  amount: number;
  paid_amount?: number;
  bank_code?: string;
  paid_at?: string;
  payer_email: string;
  description: string;
  created: string;
  updated: string;
  currency: string;
  payment_channel?: string;
  payment_destination?: string;
  success_redirect_url?: string;
  failure_redirect_url?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string;
    url?: string;
  }>;
  fees?: Array<{
    type: string;
    value: number;
  }>;
  [key: string]: unknown;
}

@ApiTags('Webhook')
@Controller('webhook/xendit')
@SkipThrottle()
export class XenditWebhookController {
  private readonly logger = new Logger(XenditWebhookController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly xenditService: XenditService,
    private readonly whatsappApi: WhatsappApiService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * ==========================================================================
   * XENDIT PAYMENT CALLBACK
   * ==========================================================================
   * Handle callback dari Xendit saat payment status berubah
   */
  @Public()
  @Post()
  @ApiOperation({ summary: 'Receive Xendit payment webhook' })
  async handleWebhook(
    @Body() payload: XenditWebhookPayload,
    @Headers('x-callback-token') callbackToken: string,
    @Headers('x-callback-signature') callbackSignature: string,
  ): Promise<{ status: string; message?: string }> {
    try {
      this.logger.log(`Received Xendit webhook: ${payload.id} - Status: ${payload.status}`);

      // Verify webhook: cek x-callback-token ATAU x-callback-signature
      if (callbackToken) {
        // Metode 1: Token verification (selalu dikirim Xendit)
        const isValid = this.xenditService.verifyWebhookToken(callbackToken);
        if (!isValid) {
          this.logger.error('Invalid webhook callback token');
          throw new UnauthorizedException('Invalid callback token');
        }
      } else if (callbackSignature) {
        // Metode 2: HMAC Signature verification
        const isValid = this.xenditService.verifyWebhookSignature(
          JSON.stringify(payload),
          callbackSignature,
        );
        if (!isValid) {
          this.logger.error('Invalid webhook signature');
          throw new UnauthorizedException('Invalid signature');
        }
      } else {
        this.logger.error('Missing webhook verification header');
        throw new UnauthorizedException('Missing webhook verification');
      }

      // Handle based on payment status
      switch (payload.status) {
        case 'PAID':
        case 'SETTLED':
          return await this.handlePaymentSuccess(payload);

        case 'EXPIRED':
          return await this.handlePaymentExpired(payload);

        case 'PENDING':
          this.logger.log(`Payment pending: ${payload.id}`);
          return { status: 'ok', message: 'Payment pending acknowledged' };

        default:
          this.logger.warn(`Unhandled payment status: ${payload.status}`);
          return { status: 'ok', message: 'Status acknowledged' };
      }
    } catch (error) {
      this.logger.error(`Webhook error: ${(error as Error).message}`);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  /**
   * ==========================================================================
   * HANDLE PAYMENT SUCCESS
   * ==========================================================================
   */
  private async handlePaymentSuccess(
    payload: XenditWebhookPayload,
  ): Promise<{ status: string; message: string }> {
    try {
      this.logger.log(`Processing successful payment: ${payload.id}`);

      // Process payment success
      const result = await this.orderService.processPaymentSuccess(payload.id, payload as Record<string, unknown>);

      if (!result.success) {
        this.logger.error(`Failed to process payment: ${result.message}`);
        return { status: 'error', message: result.message || 'Processing failed' };
      }

      // If OTP generated, send it to user via WhatsApp
      if (result.otpCode && result.orderId) {
        await this.sendOtpToUser(result.orderId, result.otpCode);
      }

      this.logger.log(`Payment success processed: ${payload.id}`);
      return { status: 'ok', message: 'Payment success processed' };
    } catch (error) {
      this.logger.error(`Payment success handler error: ${(error as Error).message}`);
      return { status: 'error', message: 'Failed to process payment success' };
    }
  }

  /**
   * ==========================================================================
   * HANDLE PAYMENT EXPIRED
   * ==========================================================================
   * Handle saat payment link expired dari Xendit.
   * - Update payment status ke EXPIRED
   * - Update order status ke FAILED
   * - Update cart status ke CANCELLED
   * - Notifikasi user
   */
  private async handlePaymentExpired(
    payload: XenditWebhookPayload,
  ): Promise<{ status: string; message: string }> {
    try {
      this.logger.log(`Processing expired payment: ${payload.id}`);

      // Gunakan OrderService untuk process payment expired
      const result = await this.orderService.processPaymentExpired(
        payload.id,
        payload as Record<string, unknown>,
      );

      if (!result.success) {
        this.logger.error(`Failed to process expired payment: ${result.message}`);
        return { status: 'error', message: result.message || 'Processing failed' };
      }

      // Send notification to user
      if (result.orderId) {
        await this.sendExpiryNotification(result.orderId, result.cartId);
      }

      this.logger.log(`Payment expired processed: ${payload.id}, Order: ${result.orderId}, Cart: ${result.cartId}`);
      return { status: 'ok', message: 'Payment expired processed. Order marked as FAILED, Cart CANCELLED.' };
    } catch (error) {
      this.logger.error(`Payment expired handler error: ${(error as Error).message}`);
      return { status: 'error', message: 'Failed to process payment expiry' };
    }
  }

  /**
   * ==========================================================================
   * SEND OTP TO USER
   * ==========================================================================
   */
  private async sendOtpToUser(orderId: number, otpCode: string): Promise<void> {
    try {
      // Get order with user details
      const order = await this.orderService.getOrderById(orderId);

      if (!order || !order.user) {
        this.logger.error(`Order or user not found for OTP: ${orderId}`);
        return;
      }

      // Get OTP expiry hours
      const otpExpiryHours = 24; // Default 24 hours

      // Format success message with OTP
      const message = this.orderService.formatSuccessMessageWithOtp(otpCode, otpExpiryHours);

      // Send WhatsApp message
      const response = await this.whatsappApi.sendMessage({
        type: 'text',
        to: order.user.phone_number,
        data: { text: message },
      });

      // Save to chat history
      await this.chatService.saveMessage({
        user_id: order.user_id,
        wa_message_id: response.messages[0]?.id,
        message: message,
        role: MessageRole.ASSISTANT,
        type: MessageType.TEXT,
      });

      this.logger.log(`OTP sent to user: ${order.user.phone_number}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * SEND EXPIRY NOTIFICATION
   * ==========================================================================
   * Kirim notifikasi ke user saat payment expired.
   */
  private async sendExpiryNotification(orderId?: number, _cartId?: number): Promise<void> {
    try {
      if (!orderId) {
        this.logger.warn('Order ID not provided for expiry notification');
        return;
      }

      // Get order dengan user info
      const order = await this.orderService.getOrderById(orderId);
      
      if (!order || !order.user) {
        this.logger.warn(`Order or user not found for expiry notification: ${orderId}`);
        return;
      }

      const message =
        `⏰ *Pembayaran Expired*\n\n` +
        `Order ID: #${orderId}\n\n` +
        `Link pembayaran Anda telah expired karena melebihi batas waktu 3 jam.\n\n` +
        `Status:\n` +
        `• Order: ❌ FAILED\n` +
        `• Cart: ❌ CANCELLED\n\n` +
        `Jika Anda masih ingin memesan, silakan buat pesanan baru dengan harga terkini.`;

      // Send WhatsApp message
      const response = await this.whatsappApi.sendMessage({
        type: 'text',
        to: order.user.phone_number,
        data: { text: message },
      });

      // Save to chat history
      await this.chatService.saveMessage({
        user_id: order.user_id,
        wa_message_id: response.messages[0]?.id,
        message: message,
        role: MessageRole.ASSISTANT,
        type: MessageType.TEXT,
      });

      this.logger.log(`Expiry notification sent to user: ${order.user.phone_number}`);
    } catch (error) {
      this.logger.error(`Failed to send expiry notification: ${(error as Error).message}`);
    }
  }
}
