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
import { Cost, ModelAI } from '../../../database/models';
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
   */
  async trackCost(
    completion: CompletionResponse,
    agentId: number | null,
    userId: number,
    waMessageId: string,
    messagesPayload: ChatMessage[],
    executionTime: number = 0,
  ): Promise<void> {
    try {
      // Lookup model_ai_id dari ModelAI berdasarkan nama model
      const modelInfo = await this.modelAiModel.findOne({
        where: { model: completion.model },
      });

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
      });

      this.logger.log(
        `💰 Cost tracked: $${totalCost.toFixed(6)} | Model: ${completion.model} | Tokens: ${tokenInput + tokenOutput} | AgentID: ${agentId || 'null'}`,
      );
    } catch (error) {
      this.logger.error(`Failed to track cost: ${(error as Error).message}`);
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
