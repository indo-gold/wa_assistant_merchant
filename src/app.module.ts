import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
/**
 * ============================================================================
 * APP MODULE - Root Module
 * ============================================================================
 *
 * File ini adalah root module dari aplikasi WhatsApp Assistant.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

// Database Models
import {
  User,
  ChatHistory,
  Product,
  Cart,
  Order,
  StudioAI,
  AgentAI,
  ModelAI,
  Cost,
  Survey,
  SurveyDetail,
  ReminderProducts,
  MetaBlastMessage,
  BlastRecipients,
  TemplateMessage,
  MediaMessage,
  GeneralVariables,
  KnowledgeBase,
  UserPenalty,
  UserNeedHelp,
  ChatUserComplain,
  Personalization,
  ProductsHistory,
  ErrorLog,
  WebhookRequest,
  OrderPayment,
  OrderOtp,
  KtpVerification,
  Promo,
  PromoProduct,
  PromoUsageLog,
} from './database/models';
import { TemplateMessageModule } from './modules/template-message/template-message.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { MediaMessageModule } from './modules/media-message/media-message.module';
import { BlastMessageModule } from './modules/blast-message/blast-message.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
// Shared Modules
import { LoggerSharedModule } from './shared/logger/logger.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { ProductModule } from './modules/product/product.module';
import { HttpSharedModule } from './shared/http/http.module';
import { OrderModule } from './modules/order/order.module';
import { MediaModule } from './modules/media/media.module';
// Configuration
import { DatabaseConfig } from './config/database.config';
import { UserModule } from './modules/user/user.module';
import { CronModule } from './modules/cron/cron.module';
import { ChatModule } from './modules/chat/chat.module';
// Modules
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { allConfigs } from './config/app.config';

@Module({
  imports: [
    // 1. Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: allConfigs,
      envFilePath: ['.env', '.env.local'],
    }),

    // 2. Database
    SequelizeModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    SequelizeModule.forFeature([
      User,
      ChatHistory,
      Product,
      Cart,
      Order,
      StudioAI,
      AgentAI,
      ModelAI,
      Cost,
      Survey,
      SurveyDetail,
      ReminderProducts,
      MetaBlastMessage,
      BlastRecipients,
      TemplateMessage,
      MediaMessage,
      GeneralVariables,
      KnowledgeBase,
      UserPenalty,
      UserNeedHelp,
      ChatUserComplain,
      Personalization,
      ProductsHistory,
      ErrorLog,
      WebhookRequest,
      OrderPayment,
      OrderOtp,
      KtpVerification,
      Promo,
      PromoProduct,
      PromoUsageLog,
    ]),

    // 3. Logger
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  levelFirst: true,
                  translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                },
              }
            : undefined,
        customProps: () => ({ context: 'HTTP' }),
        redact: {
          paths: ['req.headers.authorization', 'req.headers["x-internal-secret"]'],
          remove: true,
        },
      },
    }),

    // 4. Scheduling
    ScheduleModule.forRoot(),

    // 5. HTTP
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (status: number) => status < 500,
    }),

    // 6. JWT
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('app.jwtSecret'),
        signOptions: {
          expiresIn: config.get('app.jwtExpiresIn'),
        },
      }),
    }),

    // 7. Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,        // 1 second
        limit: 10,        // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000,       // 10 seconds
        limit: 50,        // 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,       // 1 minute
        limit: 200,       // 200 requests per minute
      },
    ]),

    // 8. Shared
    LoggerSharedModule,
    HttpSharedModule,

    // 9. Domain Modules
    AuthModule,
    UserModule,
    ChatModule,
    ProductModule,
    OrderModule,
    WhatsappModule,
    AiModule,
    KnowledgeBaseModule,
    MediaModule,
    WebhookModule,
    CronModule,
    BlastMessageModule,
    TemplateMessageModule,
    MediaMessageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
