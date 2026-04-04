import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
/**
 * ============================================================================
 * WEBHOOK MODULE
 * ============================================================================
 *
 * Module untuk webhook handlers (Meta WhatsApp & Xendit Payment).
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Module } from '@nestjs/common';

import {
  User,
  ChatHistory,
  WebhookRequest,
  Product,
  Cart,
  ChatUserComplain,
  UserNeedHelp,
  Personalization,
  ReminderProducts,
  AgentAI,
  StudioAI,
  ModelAI,
  Cost,
  OrderPayment,
  OrderOtp,
  Order,
} from '../../database/models';
import { XenditWebhookController } from './controllers/xendit-webhook.controller';
import { WhatsappApiService } from '../whatsapp/services/whatsapp-api.service';
import { MessageProcessorService } from './services/message-processor.service';
import { MetaWebhookController } from './controllers/meta-webhook.controller';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { WebhookLoggingService } from './services/webhook-logging.service';
import { XenditService } from '../order/services/xendit.service';
import { OrderService } from '../order/services/order.service';
import { MediaService } from '../media/services/media.service';
import { UserModule } from '../user/user.module';
import { ChatService } from '../chat/services/chat.service';
import { ProductModule } from '../product/product.module';
import { OrderModule } from '../order/order.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    HttpModule,
    KnowledgeBaseModule,
    ProductModule,
    OrderModule,
    AiModule,
    UserModule,
    SequelizeModule.forFeature([
      User,
      ChatHistory,
      StudioAI,
      AgentAI,
      ModelAI,
      Cost,
      WebhookRequest,
      Product,
      Cart,
      ChatUserComplain,
      UserNeedHelp,
      Personalization,
      ReminderProducts,
      OrderPayment,
      OrderOtp,
      Order,
    ]),
  ],
  controllers: [MetaWebhookController, XenditWebhookController],
  providers: [
    MessageProcessorService,
    WebhookLoggingService,
    ChatService,
    WhatsappApiService,
    MediaService,
    XenditService,
    OrderService,
  ],
  exports: [WebhookLoggingService],
})
export class WebhookModule {}
