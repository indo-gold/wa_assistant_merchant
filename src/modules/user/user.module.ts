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

@Module({
  imports: [SequelizeModule.forFeature([User, ChatHistory, KtpVerification])],
  providers: [UserService, KtpVerificationService],
  exports: [UserService, KtpVerificationService],
})
export class UserModule {}
