/**
 * ============================================================================
 * UPDATE USER DTO
 * ============================================================================
 * 
 * DTO untuk update user.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { UserStatus } from '../../../database/models';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
