/**
 * ============================================================================
 * CURRENT USER DECORATOR
 * ============================================================================
 * 
 * Custom decorator untuk mengambil user data dari request.
 * 
 * Usage:
 * @Controller('users')
 * export class UserController {
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: User) {
 *     return user;
 *   }
 *   
 *   @Get('email')
 *   getEmail(@CurrentUser('email') email: string) {
 *     return email;
 *   }
 * }
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

/**
 * Request dengan user property (setelah JWT auth)
 */
export interface RequestWithUser extends FastifyRequest {
  user?: {
    id: number;
    phone_number: string;
    name: string;
    [key: string]: unknown;
  };
}

/**
 * Decorator untuk mengambil user dari request
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestWithUser['user'] | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Jika data parameter diberikan, return property tertentu
    if (data) {
      return user[data];
    }

    // Return seluruh user object
    return user;
  },
);
