/**
 * ============================================================================
 * CHAT MODULE
 * ============================================================================
 * 
 * Module untuk chat history dan conversation management.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatHistory } from '../../database/models';
import { ChatService } from './services/chat.service';

@Module({
  imports: [SequelizeModule.forFeature([ChatHistory])],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
