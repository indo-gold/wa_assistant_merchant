/**
 * ============================================================================
 * KNOWLEDGE BASE MODULE
 * ============================================================================
 * 
 * Module untuk knowledge base dan FAQ management.
 * - Google Sheet integration
 * - Database knowledge base
 * - Search functionality
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { KnowledgeBase, GeneralVariables } from '../../database/models';
import { KnowledgeBaseService } from './services/knowledge-base.service';

@Module({
  imports: [
    SequelizeModule.forFeature([KnowledgeBase, GeneralVariables]),
  ],
  controllers: [],
  providers: [KnowledgeBaseService],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
