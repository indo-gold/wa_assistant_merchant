/**
 * ============================================================================
 * AI ORCHESTRATOR SERVICE
 * ============================================================================
 *
 * Service utama untuk mengorkestrasi AI processing.
 * - Routing ke provider yang tepat (hybrid model priority)
 * - Tool execution
 * - Cost tracking
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { CompletionRequest, ChatMessage } from '../providers/base.provider';
import { CostTrackingService } from './cost-tracking.service';
import { StudioAI, AgentAI, ModelAI, CostOperationType } from '../../../database/models';
import { AiProviderFactory } from './ai-provider.factory';
import { AiProviderType } from './ai-provider.factory';

export interface OrchestratorResponse {
  content: string | null;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown>; id?: string }>;
  assistantMessage?: { role: string; content: string | null; tool_calls?: any[] };
  model: string;
  provider: string;
  executionTime: number;
}

export interface AgentParameters {
  temperature?: number;
  max_tokens?: number;
  tools?: ToolDefinition[];
  parallel_tool_calls?: boolean;
  tool_choice?: 'required' | 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
}

interface ResolvedModelConfig {
  modelName: string;
  providerType: AiProviderType;
  studioName: string;
  modelId: number;
  provider: ReturnType<AiProviderFactory['getProvider']>;
}

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    @InjectModel(StudioAI)
    private readonly studioModel: typeof StudioAI,
    @InjectModel(AgentAI)
    private readonly agentModel: typeof AgentAI,
    @InjectModel(ModelAI)
    private readonly modelAiModel: typeof ModelAI,
    private readonly providerFactory: AiProviderFactory,
    private readonly costTracking: CostTrackingService,
  ) {}

  /**
   * ==========================================================================
   * PROCESS MESSAGE
   * ==========================================================================
   * Proses pesan user dengan AI agent.
   */
  async processMessage(
    agentName: string,
    messages: ChatMessage[],
    context: {
      userPhone: string;
      userId: number;
      userName: string;
      waMessageId: string;
      replyMessageId?: string;
    },
  ): Promise<OrchestratorResponse> {
    const startTime = Date.now();

    try {
      // Get active studio configuration
      const studio = await this.getActiveStudio();
      if (!studio) throw new Error('No active studio');

      // Get agent configuration with ModelAI included
      const agent = await this.getAgent(agentName, studio.id);
      if (!agent) throw new Error(`Agent ${agentName} not found`);

      // Resolve model config: hybrid first, fallback to main
      const modelConfig = await this.resolveModelConfig(agent);

      // Parse parameters dari agent
      const parameters = this.parseAgentParameters(agent.parameters);

      // Build messages with agent instruction as system prompt
      const messagesWithInstruction: ChatMessage[] = [
        { role: 'system', content: agent.instruction },
        ...messages.filter((m) => m.role !== 'system'),
      ];

      // Build request
      const request: CompletionRequest = {
        model: modelConfig.modelName,
        messages: messagesWithInstruction,
        temperature: parameters.temperature ?? 0.7,
        max_tokens: parameters.max_tokens ?? 2000,
        store: false,
      };

      // Add tools dari parameters jika ada
      if (parameters.tools && parameters.tools.length > 0) {
        request.tools = parameters.tools.map((tool) => ({
          type: 'function',
          function: {
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters,
            strict: tool.function.strict,
          },
        }));

        // Add tool_choice jika ada
        if (parameters.tool_choice) {
          request.tool_choice = parameters.tool_choice;
        }

        // Add parallel_tool_calls jika ada
        if (typeof parameters.parallel_tool_calls !== 'undefined') {
          request.parallel_tool_calls = parameters.parallel_tool_calls;
        }
      }

      // Call AI
      const completion = await modelConfig.provider.createCompletion(request);

      // Track cost
      await this.costTracking.trackCost(
        completion,
        agent.id,
        context.userId,
        context.waMessageId,
        messagesWithInstruction,
        Date.now() - startTime,
        modelConfig.modelId,
        CostOperationType.CHAT_COMPLETION,
      );

      // Check for tool calls
      const toolCalls = completion.choices[0]?.message?.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        return {
          content: completion.choices[0]?.message?.content || null,
          toolCalls: toolCalls.map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          })),
          assistantMessage: {
            role: 'assistant',
            content: completion.choices[0]?.message?.content || null,
            tool_calls: toolCalls,
          },
          model: modelConfig.modelName,
          provider: modelConfig.studioName,
          executionTime: Date.now() - startTime,
        };
      }

      return {
        content: completion.choices[0]?.message?.content || '',
        model: modelConfig.modelName,
        provider: modelConfig.studioName,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`AI Orchestrator error: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * GET NATURAL RESPONSE
   * ==========================================================================
   * Generate natural response setelah tool execution.
   */
  async getNaturalResponse(
    messages: ChatMessage[],
    toolResults: Array<{ role: string; content: string; tool_call_id?: string; tool_name?: string }>,
    assistantMessage: { role: string; content: string | null; tool_calls?: any[] } | null,
    context: { userPhone: string; userId: number; userName: string; waMessageId: string },
  ): Promise<OrchestratorResponse> {
    const startTime = Date.now();

    try {
      // Get active studio
      const studio = await this.getActiveStudio();
      if (!studio) throw new Error('No active studio');

      const agent = await this.getAgent('Agent Response', studio.id);
      if (!agent) throw new Error('Agent Response not found');

      // Resolve model config: hybrid first, fallback to main
      const modelConfig = await this.resolveModelConfig(agent);

      // Parse parameters dari agent
      const parameters = this.parseAgentParameters(agent.parameters);

      // Build conversation with agent instruction and tool results
      const conversationHistory: ChatMessage[] = [
        { role: 'system', content: agent.instruction },
        ...messages.filter((m) => m.role !== 'system'),
      ];

      // Add assistant message with tool_calls
      if (assistantMessage && assistantMessage.tool_calls) {
        conversationHistory.push({
          role: 'assistant',
          content: assistantMessage.content,
          tool_calls: assistantMessage.tool_calls,
        });

        // Add tool results after assistant message
        for (const result of toolResults) {
          if (result.tool_call_id) {
            conversationHistory.push({
              role: 'tool',
              content: result.content,
              tool_call_id: result.tool_call_id,
            } as ChatMessage);
          }
        }
      }

      const request: CompletionRequest = {
        model: modelConfig.modelName,
        messages: conversationHistory,
        temperature: parameters.temperature ?? 0.7,
        max_tokens: parameters.max_tokens ?? 2000,
        store: false,
      };

      const completion = await modelConfig.provider.createCompletion(request);

      // Track cost
      await this.costTracking.trackCost(
        completion,
        agent.id,
        context.userId,
        context.waMessageId,
        conversationHistory,
        Date.now() - startTime,
        modelConfig.modelId,
        CostOperationType.CHAT_COMPLETION,
      );

      return {
        content: completion.choices[0]?.message?.content || '',
        model: modelConfig.modelName,
        provider: modelConfig.studioName,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Natural response error: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * RESOLVE MODEL CONFIG
   * ==========================================================================
   * Resolve provider & model untuk agent.
   * Priority: hybrid_model_id (dari studio hybrid aktif) → fallback model_id (dari studio utama is_used=1)
   */
  private async resolveModelConfig(agent: AgentAI): Promise<ResolvedModelConfig> {
    // 1. Coba hybrid model dulu
    if (agent.hybrid_model_id) {
      const hybridModel = await this.modelAiModel.findOne({
        where: { id: agent.hybrid_model_id },
        include: [
          {
            model: StudioAI,
            where: { is_active: 'active' },
            required: true,
          },
        ],
      });

      if (hybridModel?.studio) {
        const providerType = this.mapStudioToProvider(hybridModel.studio.studio);
        this.logger.log(
          `Using hybrid model: ${hybridModel.model} from ${hybridModel.studio.studio}`,
        );
        return {
          modelName: hybridModel.model,
          providerType,
          studioName: hybridModel.studio.studio,
          modelId: hybridModel.id,
          provider: this.providerFactory.getProvider(providerType),
        };
      }
    }

    // 2. Fallback ke main model dengan studio utama (is_used='1')
    const mainModel = await this.modelAiModel.findOne({
      where: { id: agent.model_id },
      include: [
        {
          model: StudioAI,
          where: { is_used: '1' },
          required: true,
        },
      ],
    });

    if (!mainModel || !mainModel.studio) {
      throw new Error(
        `No valid model configuration found for agent id=${agent.id}. Main model_id=${agent.model_id}`,
      );
    }

    const providerType = this.mapStudioToProvider(mainModel.studio.studio);
    this.logger.log(
      `Using main model: ${mainModel.model} from ${mainModel.studio.studio}`,
    );

    return {
      modelName: mainModel.model,
      providerType,
      studioName: mainModel.studio.studio,
      modelId: mainModel.id,
      provider: this.providerFactory.getProvider(providerType),
    };
  }

  /**
   * ==========================================================================
   * PARSE AGENT PARAMETERS
   * ==========================================================================
   */
  private parseAgentParameters(parameters: string | null): AgentParameters {
    if (!parameters || parameters.trim() === '' || parameters === '{}') {
      return {};
    }

    try {
      const parsed = JSON.parse(parameters) as AgentParameters;

      if (parsed.temperature !== undefined) {
        parsed.temperature = Math.max(0, Math.min(2, parsed.temperature));
      }

      if (parsed.max_tokens !== undefined) {
        parsed.max_tokens = Math.max(1, Math.floor(parsed.max_tokens));
      }

      return parsed;
    } catch (error) {
      this.logger.warn(`Failed to parse agent parameters: ${parameters}. Using defaults.`);
      return {};
    }
  }

  /**
   * ==========================================================================
   * GET ACTIVE STUDIO
   * ==========================================================================
   */
  private async getActiveStudio(): Promise<StudioAI | null> {
    return this.studioModel.findOne({
      where: { is_used: '1' },
    });
  }

  /**
   * ==========================================================================
   * GET AGENT
   * ==========================================================================
   * Get agent dengan join ModelAI.
   */
  private async getAgent(name: string, studioId: number): Promise<AgentAI | null> {
    return this.agentModel.findOne({
      where: { name, studio_id: studioId },
      include: [
        { model: ModelAI, as: 'mainModel' },
        { model: ModelAI, as: 'hybridModel' },
      ],
    });
  }

  /**
   * ==========================================================================
   * MAP STUDIO TO PROVIDER
   * ==========================================================================
   */
  private mapStudioToProvider(studio: string): AiProviderType {
    const mapping: Record<string, AiProviderType> = {
      openai: 'openai',
      groq: 'groq',
      deepseek: 'deepseek',
      openrouter: 'openrouter',
      xai: 'grok',
      grok: 'grok',
      cerebras: 'cerebras',
      bailian: 'bailian',
    };

    return mapping[studio.toLowerCase()] || 'openai';
  }
}
