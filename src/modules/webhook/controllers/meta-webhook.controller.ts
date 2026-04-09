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

import { Controller, Get, Post, Query, Body, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { SkipThrottle } from '../../../common/decorators/skip-throttle.decorator';
import { MessageProcessorService } from '../services/message-processor.service';
import { MetaWebhookPayload, WebhookVerifyQuery } from '../dto/meta-webhook.dto';

@ApiTags('Webhook')
@Controller('webhook')
@SkipThrottle()
export class MetaWebhookController {
  private readonly logger = new Logger(MetaWebhookController.name);
  private readonly verifyToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly messageProcessor: MessageProcessorService,
  ) {
    this.verifyToken = this.configService.get<string>('whatsapp.verifyToken')!;
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
    @Body() payload: MetaWebhookPayload,

  ): Promise<{ status: string }> {
    try {
      // Validasi payload structure
      if (payload.object !== 'whatsapp_business_account') {
        return { status: 'ignored' };
      }

      // Process setiap entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Handle messages
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
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
            }
          }

          // Handle status updates
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              await this.messageProcessor.updateMessageStatus(
                status.id,
                status.status,
              );
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
