/**
 * ============================================================================
 * USER MODULE
 * ============================================================================
 * 
 * Module untuk user management.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User, ChatHistory } from '../../database/models';
import { UserService } from './services/user.service';

@Module({
  imports: [SequelizeModule.forFeature([User, ChatHistory])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
