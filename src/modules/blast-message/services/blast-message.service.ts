/**
 * ============================================================================
 * BLAST MESSAGE SERVICE
 * ============================================================================
 * 
 * Service untuk mengelola blast message campaigns.
 * - Create blast campaigns
 * - Manage recipients
 * - Track delivery status
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { 
  MetaBlastMessage, 
  BlastMessageStatus, 
  BlastProcessingStatus,
  BlastRecipients,
  RecipientStatus,
} from '../../../database/models';

export interface CreateBlastDto {
  title: string;
  template_id: number;
  upload_recipients_id: number;
  upload_path: string;
  execute_date?: Date;
  is_send_now?: boolean;
}

export interface AddRecipientDto {
  blast_id: number;
  phone: string;
  template_send: string;
}

@Injectable()
export class BlastMessageService {
  private readonly logger = new Logger(BlastMessageService.name);

  constructor(
    @InjectModel(MetaBlastMessage)
    private readonly blastMessageModel: typeof MetaBlastMessage,
    @InjectModel(BlastRecipients)
    private readonly blastRecipientsModel: typeof BlastRecipients,
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * ==========================================================================
   * CREATE BLAST CAMPAIGN
   * ==========================================================================
   * Create new blast message campaign.
   */
  async createBlast(dto: CreateBlastDto): Promise<MetaBlastMessage> {
    try {
      const blast = await this.blastMessageModel.create({
        title: dto.title,
        template_id: dto.template_id,
        status: BlastMessageStatus.ACTIVE,
        upload_recipients_id: dto.upload_recipients_id,
        upload_path: dto.upload_path,
        execute_date: dto.execute_date || null,
        is_send_now: dto.is_send_now ? 1 : 0,
        total_recipients: 0,
        sent_count: 0,
        delivered_count: 0,
        read_count: 0,
        failed_count: 0,
        processing_status: BlastProcessingStatus.SCHEDULED,
      });

      this.logger.log(`Created blast campaign: ${blast.id} - ${blast.title}`);
      return blast;
    } catch (error) {
      this.logger.error(`Error creating blast: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * GET SCHEDULED BLASTS
   * ==========================================================================
   * Get blast campaigns yang scheduled untuk dieksekusi.
   */
  async getScheduledBlasts(): Promise<MetaBlastMessage[]> {
    return this.blastMessageModel.findAll({
      where: {
        status: BlastMessageStatus.ACTIVE,
        processing_status: BlastProcessingStatus.SCHEDULED,
        [Op.or]: [
          { is_send_now: 1 },
          { 
            execute_date: {
              [Op.lte]: new Date(),
            },
          },
        ],
      },
    });
  }

  /**
   * ==========================================================================
   * UPDATE BLAST STATUS
   * ==========================================================================
   * Update status processing blast campaign.
   */
  async updateBlastStatus(
    blastId: number, 
    status: BlastProcessingStatus,
  ): Promise<void> {
    await this.blastMessageModel.update(
      { processing_status: status, last_activity_at: new Date() },
      { where: { id: blastId } },
    );
  }

  /**
   * ==========================================================================
   * UPDATE BLAST COUNTS
   * ==========================================================================
   * Update count statistics untuk blast campaign.
   */
  async updateBlastCounts(blastId: number): Promise<void> {
    const counts = await this.blastRecipientsModel.findAll({
      where: { blast_id: blastId },
      attributes: [
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'total'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'sent' THEN 1 ELSE 0 END")), 'sent'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'delivered' THEN 1 ELSE 0 END")), 'delivered'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'read' THEN 1 ELSE 0 END")), 'read'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
      ],
      raw: true,
    });

    const result = counts[0] as any;
    await this.blastMessageModel.update(
      {
        total_recipients: parseInt(result.total) || 0,
        sent_count: parseInt(result.sent) || 0,
        delivered_count: parseInt(result.delivered) || 0,
        read_count: parseInt(result.read) || 0,
        failed_count: parseInt(result.failed) || 0,
        last_activity_at: new Date(),
      },
      { where: { id: blastId } },
    );
  }

  /**
   * ==========================================================================
   * ADD RECIPIENTS
   * ==========================================================================
   * Add recipients ke blast campaign.
   */
  async addRecipients(recipients: AddRecipientDto[]): Promise<void> {
    try {
      await this.blastRecipientsModel.bulkCreate(
        recipients.map(r => ({
          blast_id: r.blast_id,
          phone: r.phone,
          template_send: r.template_send,
          status: RecipientStatus.PENDING,
          retry_count: 0,
        })),
        { ignoreDuplicates: true },
      );

      this.logger.log(`Added ${recipients.length} recipients`);
    } catch (error) {
      this.logger.error(`Error adding recipients: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * GET PENDING RECIPIENTS
   * ==========================================================================
   * Get recipients yang pending untuk dikirim.
   */
  async getPendingRecipients(blastId: number, limit: number = 100): Promise<BlastRecipients[]> {
    return this.blastRecipientsModel.findAll({
      where: {
        blast_id: blastId,
        status: RecipientStatus.PENDING,
        [Op.or]: [
          { next_attempt_at: null },
          { next_attempt_at: { [Op.lte]: new Date() } },
        ],
      },
      limit,
      order: [['id', 'ASC']],
    });
  }

  /**
   * ==========================================================================
   * UPDATE RECIPIENT STATUS
   * ==========================================================================
   * Update status recipient setelah pengiriman.
   */
  async updateRecipientStatus(
    recipientId: number,
    status: RecipientStatus,
    waMessageId?: string,
    error?: string,
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (waMessageId) {
      updateData.wa_message_id = waMessageId;
    }

    if (error) {
      updateData.last_error = error;
      updateData.retry_count = this.sequelize.literal('retry_count + 1');
      updateData.next_attempt_at = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 minutes
    }

    await this.blastRecipientsModel.update(updateData, {
      where: { id: recipientId },
    });
  }

  /**
   * ==========================================================================
   * GET BLAST STATISTICS
   * ==========================================================================
   * Get statistics untuk blast campaign.
   */
  async getBlastStatistics(blastId: number): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }> {
    const counts = await this.blastRecipientsModel.findAll({
      where: { blast_id: blastId },
      attributes: [
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'total'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'sent' THEN 1 ELSE 0 END")), 'sent'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'delivered' THEN 1 ELSE 0 END")), 'delivered'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'read' THEN 1 ELSE 0 END")), 'read'],
        [this.sequelize.fn('SUM', this.sequelize.literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
      ],
      raw: true,
    });

    const result = counts[0] as any;
    return {
      total: parseInt(result.total) || 0,
      pending: parseInt(result.pending) || 0,
      sent: parseInt(result.sent) || 0,
      delivered: parseInt(result.delivered) || 0,
      read: parseInt(result.read) || 0,
      failed: parseInt(result.failed) || 0,
    };
  }
}
