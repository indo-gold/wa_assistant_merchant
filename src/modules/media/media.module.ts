/**
 * ============================================================================
 * MEDIA MODULE
 * ============================================================================
 * 
 * Module untuk file upload dan download.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { MediaService } from './services/media.service';

@Module({
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
