/**
 * ============================================================================
 * BLAST MESSAGE MODULE
 * ============================================================================
 * 
 * Module untuk blast message campaigns.
 * - Manage blast campaigns
 * - Handle recipients
 * - Track delivery status
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MetaBlastMessage, BlastRecipients } from '../../database/models';
import { BlastMessageService } from './services/blast-message.service';

@Module({
  imports: [
    SequelizeModule.forFeature([MetaBlastMessage, BlastRecipients]),
  ],
  controllers: [],
  providers: [BlastMessageService],
  exports: [BlastMessageService],
})
export class BlastMessageModule {}
