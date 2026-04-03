/**
 * ============================================================================
 * PUBLIC DECORATOR
 * ============================================================================
 * 
 * Decorator untuk menandai route yang tidak memerlukan authentication.
 * 
 * Usage:
 * @Public()
 * @Post('auth/login')
 * login() { ... }
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key untuk public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator untuk public routes (tanpa auth)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
