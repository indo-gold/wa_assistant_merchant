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
import { User, ChatHistory, KtpVerification } from '../../database/models';
import { UserService } from './services/user.service';
import { KtpVerificationService } from './services/ktp-verification.service';
import { UserController } from './controllers/user.controller';

@Module({
  imports: [SequelizeModule.forFeature([User, ChatHistory, KtpVerification])],
  controllers: [UserController],
  providers: [UserService, KtpVerificationService],
  exports: [UserService, KtpVerificationService],
})
export class UserModule {}
