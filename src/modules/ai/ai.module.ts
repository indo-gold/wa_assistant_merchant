import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
/**
 * ============================================================================
 * AI MODULE
 * ============================================================================
 *
 * Module untuk AI services dan tool calling system.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Module } from '@nestjs/common';

import {
  StudioAI,
  AgentAI,
  ModelAI,
  Cost,
  Product,
  Cart,
  ChatHistory,
  ChatUserComplain,
  UserNeedHelp,
  Personalization,
  ReminderProducts,
  OrderPayment,
  OrderOtp,
  Promo,
  PromoProduct,
  PromoUsageLog,
} from '../../database/models';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { AiOrchestratorService } from './services/ai-orchestrator.service';
import { CostTrackingService } from './services/cost-tracking.service';
import { AiProviderFactory } from './services/ai-provider.factory';
import { AiToolService } from './services/ai-tool.service';
import { ToolRegistryService } from './services/tool-registry.service';
import { VisionService } from './services/vision.service';
import { WhatsappApiService } from '../whatsapp/services/whatsapp-api.service';
import { ChatService } from '../chat/services/chat.service';
import { ProductModule } from '../product/product.module';
import { OrderModule } from '../order/order.module';
import { ChatModule } from '../chat/chat.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      StudioAI,
      AgentAI,
      ModelAI,
      Cost,
      Product,
      Cart,
      ChatHistory,
      ChatUserComplain,
      UserNeedHelp,
      Personalization,
      ReminderProducts,
      OrderPayment,
      OrderOtp,
      Promo,
      PromoProduct,
      PromoUsageLog,
    ]),
    KnowledgeBaseModule,
    ProductModule,
    OrderModule,
    ChatModule,
    UserModule,
    ConfigModule,
  ],
  providers: [AiProviderFactory, AiOrchestratorService, CostTrackingService, AiToolService, ToolRegistryService, VisionService, WhatsappApiService, ChatService],
  exports: [AiProviderFactory, AiOrchestratorService, CostTrackingService, AiToolService, ToolRegistryService, VisionService, WhatsappApiService, ChatService],
})
export class AiModule {}
