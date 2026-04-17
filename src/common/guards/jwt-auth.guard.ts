/**
 * ============================================================================
 * JWT AUTH GUARD (Global)
 * ============================================================================
 *
 * Guard global untuk autentikasi JWT.
 * Semua endpoint dilindungi kecuali yang ditandai @Public().
 *
 * @version 1.0.0
 * ============================================================================
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip jika route ditandai @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Cek juga x-internal-secret untuk internal API calls
    const internalSecret = request.headers['x-internal-secret'];
    const expectedSecret = this.configService.get<string>('app.internalSecret');
    if (expectedSecret && internalSecret) {
      const secretBuffer = Buffer.from(String(internalSecret));
      const expectedBuffer = Buffer.from(expectedSecret);
      if (
        secretBuffer.length === expectedBuffer.length &&
        timingSafeEqual(secretBuffer, expectedBuffer)
      ) {
        return true;
      }
    }

    // Cek JWT Bearer token
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const jwtSecret = this.configService.get<string>('app.jwtSecret');
      if (!jwtSecret) {
        throw new UnauthorizedException('JWT secret not configured');
      }
      const payload = this.jwtService.verify(token, { secret: jwtSecret });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
