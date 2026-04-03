/**
 * ============================================================================
 * AUTH SERVICE
 * ============================================================================
 * 
 * Service untuk authentication.
 * - Validasi API key
 * - Generate JWT token
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly secretHashedKey: string;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.secretHashedKey = this.configService.get<string>('app.secretHashedKey')!;
    this.jwtSecret = this.configService.get<string>('app.jwtSecret')!;
    this.jwtExpiresIn = this.configService.get<string>('app.jwtExpiresIn')!;
  }

  /**
   * ==========================================================================
   * VALIDATE API KEY
   * ==========================================================================
   * Validasi API key dan generate JWT token.
   */
  async validateApiKey(apiKey: string): Promise<{ token: string; expiresIn: string }> {
    // Compare API key dengan hashed key
    const isValid = await bcrypt.compare(apiKey, this.secretHashedKey);

    if (!isValid) {
      this.logger.warn('Invalid API key attempt');
      throw new UnauthorizedException('Invalid API key');
    }

    // Generate JWT token
    const payload = {
      sub: 'api_user',
      type: 'api_key',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    this.logger.log('API key validated, token generated');

    return {
      token,
      expiresIn: this.jwtExpiresIn,
    };
  }
}
