/**
 * ============================================================================
 * TEMPLATE MESSAGE MODULE
 * ============================================================================
 * 
 * Module untuk WhatsApp message template management.
 * - Template synchronization
 * - Template parsing
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TemplateMessage } from '../../database/models';
import { TemplateMessageService } from './services/template-message.service';

@Module({
  imports: [
    SequelizeModule.forFeature([TemplateMessage]),
  ],
  controllers: [],
  providers: [TemplateMessageService],
  exports: [TemplateMessageService],
})
export class TemplateMessageModule {}
