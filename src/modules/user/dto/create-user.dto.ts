/**
 * ============================================================================
 * CREATE USER DTO
 * ============================================================================
 * 
 * DTO untuk membuat user baru.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { IsString, IsNotEmpty, IsOptional, IsEnum, Length } from 'class-validator';
import { UserStatus } from '../../../database/models';

export class CreateUserDto {
  /**
   * Nama user/pelanggan
   */
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  /**
   * Nomor telepon WhatsApp (unique)
   */
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  phone_number!: string;

  /**
   * Status user (optional, default: active)
   */
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
