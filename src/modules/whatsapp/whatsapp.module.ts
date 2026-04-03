/**
 * ============================================================================
 * WHATSAPP MODULE
 * ============================================================================
 * 
 * Module untuk WhatsApp API integration.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsappApiService } from './services/whatsapp-api.service';

@Module({
  imports: [HttpModule],
  providers: [WhatsappApiService],
  exports: [WhatsappApiService],
})
export class WhatsappModule {}
