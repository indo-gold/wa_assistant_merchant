/**
 * ============================================================================
 * META WEBHOOK CONTROLLER
 * ============================================================================
 * 
 * Controller untuk handle webhook dari Meta WhatsApp API.
 * 
 * Endpoints:
 * - GET /webhook  : Webhook verification dari Meta
 * - POST /webhook : Receive message dan status updates
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Controller, Get, Post, Query, Body, Logger, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { SkipThrottle } from '../../../common/decorators/skip-throttle.decorator';
import { MessageProcessorService } from '../services/message-processor.service';
import { MetaWebhookPayload, WebhookVerifyQuery } from '../dto/meta-webhook.dto';
import * as crypto from 'crypto';

@ApiTags('Webhook')
@Controller('webhook')
@SkipThrottle()
export class MetaWebhookController {
  private readonly logger = new Logger(MetaWebhookController.name);
  private readonly verifyToken: string;
  private readonly appSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly messageProcessor: MessageProcessorService,
  ) {
    this.verifyToken = this.configService.get<string>('whatsapp.verifyToken')!;
    this.appSecret = this.configService.get<string>('whatsapp.appSecret')!;
  }

  /**
   * Verifikasi signature webhook dari Meta menggunakan x-hub-signature-256
   */
  private verifySignature(rawBody: Buffer, signature: string | undefined): boolean {
    if (!signature) return false;
    if (!this.appSecret) {
      this.logger.warn('APP_SECRET not configured, cannot verify webhook signature');
      return false;
    }

    const expectedSignature = 'sha256=' +
      crypto.createHmac('sha256', this.appSecret).update(rawBody).digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  /**
   * ==========================================================================
   * WEBHOOK VERIFICATION (GET)
   * ==========================================================================
   * Verifikasi webhook dari Meta.
   * Meta akan kirim GET request saat setup webhook.
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Verify webhook dengan Meta' })
  @ApiQuery({ name: 'hub.mode', required: true })
  @ApiQuery({ name: 'hub.verify_token', required: true })
  @ApiQuery({ name: 'hub.challenge', required: true })
  verifyWebhook(@Query() query: WebhookVerifyQuery): string {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = query;

    this.logger.log(`Webhook verification attempt - Mode: ${mode}`);

    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('✅ Webhook verified successfully');
      return challenge;
    }

    this.logger.error('❌ Webhook verification failed');
    throw new Error('Verification failed');
  }

  /**
   * ==========================================================================
   * RECEIVE WEBHOOK (POST)
   * ==========================================================================
   * Receive message dan status updates dari Meta.
   */
  @Public()
  @Post()
  @ApiOperation({ summary: 'Receive webhook dari Meta WhatsApp' })
  async receiveWebhook(
    @Req() req: any,
    @Body() payload: MetaWebhookPayload,
  ): Promise<{ status: string }> {
    try {
      // Verifikasi signature dari Meta (x-hub-signature-256)
      const signature = req.headers['x-hub-signature-256'] as string | undefined;
      const rawBody = (req as any).rawBody as Buffer | undefined;

      if (rawBody && !this.verifySignature(rawBody, signature)) {
        this.logger.error('❌ Invalid webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }

      // Validasi payload structure
      if (payload.object !== 'whatsapp_business_account') {
        return { status: 'ignored' };
      }

      // Process setiap entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Handle messages (per-message error handling agar 1 gagal tidak block batch)
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              try {
                // Skip jika timestamp terlalu lama (>10 detik)
                const messageTime = parseInt(message.timestamp, 10);
                const currentTime = Math.floor(Date.now() / 1000);
                if (currentTime - messageTime > 10) {
                  this.logger.log(`Expired message ignored: ${message.id}`);
                  continue;
                }

                // Process message
                const contact = value.contacts?.[0];
                if (contact) {
                  await this.messageProcessor.processMessage(
                    message,
                    contact,
                  );
                }
              } catch (msgError) {
                this.logger.error(`Failed to process message ${message.id}: ${(msgError as Error).message}`);
              }
            }
          }

          // Handle status updates
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              try {
                await this.messageProcessor.updateMessageStatus(
                  status.id,
                  status.status,
                );
              } catch (statusError) {
                this.logger.error(`Failed to update status ${status.id}: ${(statusError as Error).message}`);
              }
            }
          }

          // Handle template status updates
          if (change.field === 'message_template_status_update') {
            this.logger.log(`Template status update received`);
          }
        }
      }

      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Webhook error: ${(error as Error).message}`);
      return { status: 'error' };
    }
  }
}
