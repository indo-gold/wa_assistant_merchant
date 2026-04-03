/**
 * ============================================================================
 * MEDIA MESSAGE MODULE
 * ============================================================================
 * 
 * Module untuk media message management.
 * - Track downloaded media
 * - Media metadata storage
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MediaMessage } from '../../database/models';
import { MediaMessageService } from './services/media-message.service';

@Module({
  imports: [
    SequelizeModule.forFeature([MediaMessage]),
  ],
  controllers: [],
  providers: [MediaMessageService],
  exports: [MediaMessageService],
})
export class MediaMessageModule {}
