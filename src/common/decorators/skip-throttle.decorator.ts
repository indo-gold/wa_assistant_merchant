/**
 * ============================================================================
 * SKIP THROTTLE DECORATOR
 * ============================================================================
 *
 * Decorator untuk menonaktifkan rate limiting pada endpoint tertentu.
 * Berguna untuk webhook endpoints yang menerima request dari third-party.
 *
 * @example
 * ```typescript
 * @SkipThrottle()
 * @Post('webhook')
 * async handleWebhook() { ... }
 * ```
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { SkipThrottle } from '@nestjs/throttler';

export { SkipThrottle };
