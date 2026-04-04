/**
 * ============================================================================
 * COST TRACKING SERVICE
 * ============================================================================
 * 
 * Service untuk tracking cost penggunaan AI.
 * - Menghitung cost berdasarkan token usage
 * - Menyimpan ke database untuk analytics
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Cost, CostOperationType, ModelAI } from '../../../database/models';
import { CompletionResponse, ChatMessage } from '../providers/base.provider';

@Injectable()
export class CostTrackingService {
  private readonly logger = new Logger(CostTrackingService.name);

  constructor(
    @InjectModel(Cost)
    private readonly costModel: typeof Cost,
    @InjectModel(ModelAI)
    private readonly modelAiModel: typeof ModelAI,
  ) {}

  /**
   * ==========================================================================
   * TRACK COST
   * ==========================================================================
   * Hitung dan simpan cost dari completion.
   * 
   * @param modelAiId - Optional exact model_ai.id. If provided, lookup by PK.
   *                    If not provided, fallback to string matching by completion.model.
   * @param operationType - Type of AI operation for categorization.
   */
  async trackCost(
    completion: CompletionResponse,
    agentId: number | null,
    userId: number,
    waMessageId: string,
    messagesPayload: ChatMessage[],
    executionTime: number = 0,
    modelAiId?: number,
    operationType: CostOperationType = CostOperationType.CHAT_COMPLETION,
  ): Promise<void> {
    try {
      let modelInfo: ModelAI | null = null;

      // 1. Prefer exact lookup by modelAiId if provided
      if (modelAiId) {
        modelInfo = await this.modelAiModel.findByPk(modelAiId);
      }

      // 2. Fallback to string matching by completion.model
      if (!modelInfo) {
        modelInfo = await this.modelAiModel.findOne({
          where: { model: completion.model },
        });
      }

      if (!modelInfo) {
        this.logger.warn(`Model ${completion.model} not found in model_ai table`);
        return;
      }

      // Calculate cost
      const tokenInput = completion.usage.prompt_tokens || completion.usage.input_tokens || 0;
      const tokenOutput = completion.usage.completion_tokens || completion.usage.output_tokens || 0;
      const tokenCached = 
        completion.usage.prompt_tokens_details?.cached_tokens ||
        completion.usage.input_tokens_details?.cached_tokens ||
        0;

      // Calculate cost based on model pricing
      const costInput = ((tokenInput - tokenCached) / modelInfo.token_per) * modelInfo.input;
      const costOutput = (tokenOutput / modelInfo.token_per) * modelInfo.output;
      const costCached = (tokenCached / modelInfo.token_per) * modelInfo.cached;
      const totalCost = costInput + costOutput + costCached;

      // Save to database
      await this.costModel.create({
        object: completion.object,
        user_id: userId,
        created: completion.created || Math.floor(Date.now() / 1000),
        model: completion.model,
        prompt_tokens: tokenInput,
        cached_tokens: tokenCached,
        completion_tokens: tokenOutput,
        estimate_cost: totalCost,
        execution_time: executionTime,
        json_data: completion as unknown as Record<string, unknown>,
        wa_message_id: waMessageId,
        messages_payload: JSON.stringify(messagesPayload, null, 2),
        model_ai_id: modelInfo.id,
        agent_id: agentId,
        operation_type: operationType,
      });

      this.logger.log(
        `💰 Cost tracked: $${totalCost.toFixed(6)} | Model: ${completion.model} | Tokens: ${tokenInput + tokenOutput} | AgentID: ${agentId || 'null'} | Op: ${operationType}`,
      );
    } catch (error) {
      this.logger.error(`Failed to track cost: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * TRACK AUDIO TRANSCRIPTION COST
   * ==========================================================================
   * Hitung dan simpan cost dari Whisper transcription.
   * Whisper pricing: $0.006 per minute (OpenAI)
   * Duration diestimasi dari file size (WhatsApp OGG ~12KB/s)
   */
  async trackAudioTranscriptionCost(
    userId: number,
    waMessageId: string,
    audioBuffer: Buffer,
    executionTime: number = 0,
    modelAiId?: number,
  ): Promise<void> {
    try {
      // Estimasi durasi: WhatsApp voice note OGG ~12KB/s
      const estimatedSeconds = audioBuffer.length / 12000;
      const durationMinutes = estimatedSeconds / 60;

      // Whisper-1 pricing: $0.006 per minute
      const estimatedCost = durationMinutes * 0.006;

      let modelInfo: ModelAI | null = null;
      if (modelAiId) {
        modelInfo = await this.modelAiModel.findByPk(modelAiId);
      }
      if (!modelInfo) {
        modelInfo = await this.modelAiModel.findOne({
          where: { model: 'whisper-1' },
        });
      }

      await this.costModel.create({
        object: 'audio.transcription',
        user_id: userId,
        created: Math.floor(Date.now() / 1000),
        model: 'whisper-1',
        prompt_tokens: Math.floor(estimatedSeconds),
        cached_tokens: 0,
        completion_tokens: 0,
        estimate_cost: estimatedCost,
        execution_time: executionTime,
        messages_payload: JSON.stringify({
          estimated_seconds: estimatedSeconds,
          file_size: audioBuffer.length,
        }),
        json_data: {
          estimated_duration_seconds: estimatedSeconds,
          file_size: audioBuffer.length,
        },
        wa_message_id: waMessageId,
        model_ai_id: modelInfo?.id || 0,
        agent_id: null,
        operation_type: CostOperationType.AUDIO_TRANSCRIPTION,
      });

      this.logger.log(
        `💰 Audio cost tracked: $${estimatedCost.toFixed(6)} | Estimated: ${estimatedSeconds.toFixed(1)}s | Op: ${CostOperationType.AUDIO_TRANSCRIPTION}`,
      );
    } catch (error) {
      this.logger.error(`Failed to track audio cost: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * GET TOTAL COST BY DATE RANGE
   * ==========================================================================
   */
  async getTotalCostByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.costModel.sum('estimate_cost', {
      where: {
        timestamp: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    return result || 0;
  }

  /**
   * ==========================================================================
   * GET COST BY USER
   * ==========================================================================
   */
  async getCostByUser(userId: number): Promise<number> {
    const result = await this.costModel.sum('estimate_cost', {
      where: { user_id: userId },
    });

    return result || 0;
  }
}
