/**
 * ============================================================================
 * AUTH CONTROLLER
 * ============================================================================
 * 
 * Controller untuk authentication endpoints.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Controller, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthService } from '../services/auth.service';
import { LoginResponseDto } from '../dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * ==========================================================================
   * LOGIN
   * ==========================================================================
   * Login dengan API key untuk mendapatkan JWT token.
   */
  @Public()
  @Post()
  @ApiOperation({ summary: 'Login dengan API Key' })
  @ApiQuery({ name: 'api_key', required: true, description: 'API Key' })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  async login(@Query('api_key') apiKey: string): Promise<LoginResponseDto> {
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    return this.authService.validateApiKey(apiKey);
  }
}
