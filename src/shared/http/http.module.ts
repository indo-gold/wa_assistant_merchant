/**
 * ============================================================================
 * HTTP SHARED MODULE
 * ============================================================================
 * 
 * Module untuk shared HTTP functionality.
 * Menyediakan configured Axios instance dengan interceptors.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  exports: [HttpModule],
})
export class HttpSharedModule {}
