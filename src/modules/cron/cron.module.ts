import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
/**
 * ============================================================================
 * CRON MODULE
 * ============================================================================
 *
 * Module untuk scheduled tasks dan background jobs.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Module } from '@nestjs/common';

import {
  Cart,
  Order,
  User,
  Product,
  ChatHistory,
  Survey,
  SurveyDetail,
  GeneralVariables,
  ReminderProducts,
  OrderPayment,
  OrderOtp,
} from '../../database/models';
import { WhatsappApiService } from '../whatsapp/services/whatsapp-api.service';
import { ReminderProductService } from './services/reminder-product.service';
import { FollowupOrderService } from './services/followup-order.service';
import { FollowupCartService } from './services/followup-cart.service';
import { PaymentCronService } from './services/payment-cron.service';
import { PaymentExpiredCronService } from './services/payment-expired-cron.service';
import { ChatService } from '../chat/services/chat.service';
import { OrderService } from '../order/services/order.service';
import { XenditService } from '../order/services/xendit.service';

@Module({
  imports: [
    HttpModule,
    SequelizeModule,
    SequelizeModule.forFeature([
      Cart,
      Order,
      User,
      Product,
      ChatHistory,
      Survey,
      SurveyDetail,
      GeneralVariables,
      ReminderProducts,
      OrderPayment,
      OrderOtp,
    ]),
  ],
  providers: [
    FollowupCartService,
    FollowupOrderService,
    ReminderProductService,
    PaymentCronService,
    PaymentExpiredCronService,
    WhatsappApiService,
    ChatService,
    OrderService,
    XenditService,
  ],
})
export class CronModule {}
