/**
 * ============================================================================
 * LOGIN DTO
 * ============================================================================
 * 
 * DTO untuk login authentication.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'API Key untuk authentication' })
  @IsString()
  @IsNotEmpty()
  api_key!: string;
}

export class LoginResponseDto {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  expiresIn!: string;
}
