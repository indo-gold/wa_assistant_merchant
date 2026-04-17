/**
 * ============================================================================
 * INTERNAL API GUARD
 * ============================================================================
 *
 * Guard untuk melindungi internal API endpoints.
 * Hanya menerima request dari frontend dengan secret key yang valid.
 *
 * Usage:
 * ```typescript
 * @UseGuards(InternalApiGuard)
 * @Controller('internal')
 * export class InternalController {}
 * ```
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const internalSecret = request.headers['x-internal-secret'];
    const expectedSecret = this.configService.get<string>('app.internalSecret');

    if (!expectedSecret) {
      throw new UnauthorizedException('Internal API not configured');
    }

    if (!internalSecret) {
      throw new UnauthorizedException('Invalid internal API secret');
    }

    // Timing-safe comparison untuk mencegah timing attack
    const secretBuffer = Buffer.from(String(internalSecret));
    const expectedBuffer = Buffer.from(expectedSecret);

    if (secretBuffer.length !== expectedBuffer.length || !timingSafeEqual(secretBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Invalid internal API secret');
    }

    return true;
  }
}
