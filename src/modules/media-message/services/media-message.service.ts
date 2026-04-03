/**
 * ============================================================================
 * MEDIA MESSAGE SERVICE
 * ============================================================================
 * 
 * Service untuk mengelola media messages.
 * - Save media metadata
 * - Track downloaded media
 * - Get media by WA message ID
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MediaMessage } from '../../../database/models';

export interface SaveMediaDto {
  wa_message_id?: string;
  file_name?: string;
  original_name?: string;
  url?: string;
  caption?: string;
}

@Injectable()
export class MediaMessageService {
  private readonly logger = new Logger(MediaMessageService.name);

  constructor(
    @InjectModel(MediaMessage)
    private readonly mediaModel: typeof MediaMessage,
  ) {}

  /**
   * ==========================================================================
   * SAVE MEDIA
   * ==========================================================================
   * Save media metadata ke database.
   */
  async saveMedia(dto: SaveMediaDto): Promise<MediaMessage> {
    try {
      const media = await this.mediaModel.create({
        wa_message_id: dto.wa_message_id,
        file_name: dto.file_name,
        original_name: dto.original_name,
        url: dto.url,
        caption: dto.caption,
        timestamp: new Date(),
      });

      this.logger.log(`Saved media: ${media.id} - ${dto.file_name || 'unnamed'}`);
      return media;
    } catch (error) {
      this.logger.error(`Error saving media: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * GET MEDIA BY WA MESSAGE ID
   * ==========================================================================
   * Get media by WhatsApp message ID.
   */
  async getMediaByWaMessageId(waMessageId: string): Promise<MediaMessage | null> {
    return this.mediaModel.findOne({
      where: { wa_message_id: waMessageId },
    });
  }

  /**
   * ==========================================================================
   * GET MEDIA BY ID
   * ==========================================================================
   * Get media by ID.
   */
  async getMediaById(id: number): Promise<MediaMessage | null> {
    return this.mediaModel.findByPk(id);
  }

  /**
   * ==========================================================================
   * GET RECENT MEDIA
   * ==========================================================================
   * Get recent media messages.
   */
  async getRecentMedia(limit: number = 20): Promise<MediaMessage[]> {
    return this.mediaModel.findAll({
      order: [['timestamp', 'DESC']],
      limit,
    });
  }

  /**
   * ==========================================================================
   * UPDATE MEDIA URL
   * ==========================================================================
   * Update URL setelah media di-download.
   */
  async updateMediaUrl(
    id: number, 
    url: string, 
    fileName?: string,
  ): Promise<void> {
    const updateData: any = { url };
    if (fileName) {
      updateData.file_name = fileName;
    }

    await this.mediaModel.update(updateData, {
      where: { id },
    });

    this.logger.log(`Updated media URL: ${id}`);
  }

  /**
   * ==========================================================================
   * DELETE MEDIA
   * ==========================================================================
   * Delete media record.
   */
  async deleteMedia(id: number): Promise<void> {
    await this.mediaModel.destroy({
      where: { id },
    });

    this.logger.log(`Deleted media: ${id}`);
  }
}
