/**
 * ============================================================================
 * TOOL REGISTRY SERVICE
 * ============================================================================
 *
 * Service untuk mengelola AI tools/functions.
 * Tools didefinisikan di database (agent_ai.parameters) dan diregister secara dinamis.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import {
  ToolDefinition,
  ToolHandler,
  RegisteredTool,
  ToolContext,
  ToolResult,
} from '../entities/tool.entity';
import { AgentAI, StudioAI } from '../../../database/models';
import { AiToolService } from './ai-tool.service';

@Injectable()
export class ToolRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly tools = new Map<string, RegisteredTool>();

  constructor(
    private readonly aiToolService: AiToolService,
    @InjectModel(AgentAI)
    private readonly agentModel: typeof AgentAI,
    @InjectModel(StudioAI)
    private readonly studioModel: typeof StudioAI,
  ) {}

  /**
   * Initialize default tools saat module init
   */
  async onModuleInit(): Promise<void> {
    await this.loadToolsFromDatabase();
    this.logger.log(`🛠️  Registered ${this.tools.size} tools from database`);
  }

  /**
   * ==========================================================================
   * LOAD TOOLS FROM DATABASE
   * ==========================================================================
   * Load tools dari database (agent_ai.parameters)
   */
  private async loadToolsFromDatabase(): Promise<void> {
    try {
      // Get active studio
      const studio = await this.studioModel.findOne({ where: { is_used: '1' } });
      if (!studio) {
        this.logger.warn('No active studio found, skipping tool loading');
        return;
      }

      // Get all agents dengan tools
      const agents = await this.agentModel.findAll({
        where: { studio_id: studio.id },
      });

      for (const agent of agents) {
        if (!agent.parameters) continue;

        try {
          const params = JSON.parse(agent.parameters);

          // Check if this agent has tools defined
          if (params.tools && Array.isArray(params.tools)) {
            for (const tool of params.tools) {
              if (tool.type === 'function' && tool.function?.name) {
                this.registerToolFromDatabase(tool, agent.name);
              }
            }
          }
        } catch (parseError) {
          this.logger.warn(
            `Failed to parse parameters for agent ${agent.name}: ${(parseError as Error).message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to load tools from database: ${(error as Error).message}`);
    }
  }

  /**
   * ==========================================================================
   * REGISTER TOOL FROM DATABASE
   * ==========================================================================
   * Register tool yang didefinisikan di database
   */
  private registerToolFromDatabase(toolDef: ToolDefinition, agentName: string): void {
    const name = toolDef.function.name;

    // Map tool name ke handler method di AiToolService
    const handler = this.resolveToolHandler(name);

    if (!handler) {
      this.logger.warn(`No handler found for tool: ${name} (from ${agentName})`);
      return;
    }

    this.registerTool(toolDef, handler);
  }

  /**
   * ==========================================================================
   * RESOLVE TOOL HANDLER
   * ==========================================================================
   * Map tool name ke handler method di AiToolService
   */
  private resolveToolHandler(name: string): ToolHandler | null {
    const handlerMap: Record<string, (args: any, context: any) => Promise<ToolResult>> = {
      search_knowledge_base: (args, ctx) =>
        this.aiToolService.searchKnowledgeBase(args.query, args.keyword, ctx),

      get_gold_info: (args, ctx) =>
        this.aiToolService.getGoldInfo(args.action, args.user_request, ctx),

      get_product_budget: (args, ctx) =>
        this.aiToolService.getProductBudget(args.nominal_budget, ctx),

      get_order_emas_detail: (args, ctx) => this.aiToolService.getOrderEmasDetail(args, ctx),

      get_user_confirm_buy: (args, ctx) =>
        this.aiToolService.getUserConfirmBuy(args.user_answer, ctx),

      get_user_complain: (args, ctx) =>
        this.aiToolService.getUserComplain(args.assistant_answer, args.issue_category, ctx),

      get_promo: () => this.aiToolService.getPromo(),

      get_user_need_help: (args, ctx) =>
        this.aiToolService.getUserNeedHelp(args.assistant_answer, args.topic, ctx),

      personalization: (args, ctx) =>
        this.aiToolService.setPersonalization(
          args.personality,
          args.assistant_answer,
          ctx,
          args.nickname,
          args.age,
          args.occupation,
          args.language_style,
          args.interests,
          args.notes,
        ),

      set_product_reminder: (args, ctx) => this.aiToolService.setProductReminder(args.query, ctx),

      ignore_message: (args) => this.aiToolService.ignoreMessage(args.query),

      reply_immediately: (args) => this.aiToolService.replyImmediately(args.assistant_answer),
    };

    return handlerMap[name] || null;
  }

  /**
   * ==========================================================================
   * REGISTER TOOL
   * ==========================================================================
   * Register tool baru ke registry.
   */
  registerTool(definition: ToolDefinition, handler: ToolHandler): void {
    const name = definition.function.name;

    if (this.tools.has(name)) {
      this.logger.warn(`Tool '${name}' already registered, overwriting...`);
    }

    this.tools.set(name, { definition, handler });
    this.logger.log(`Tool registered: ${name}`);
  }

  /**
   * ==========================================================================
   * GET TOOL
   * ==========================================================================
   * Get tool by name.
   */
  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /**
   * ==========================================================================
   * GET ALL TOOL DEFINITIONS
   * ==========================================================================
   * Get semua tool definitions untuk AI prompt.
   */
  getAllToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((tool) => tool.definition);
  }

  /**
   * ==========================================================================
   * EXECUTE TOOL
   * ==========================================================================
   * Execute tool by name dengan arguments.
   */
  async executeTool(
    name: string,
    args: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        data: null,
        message: `Tool '${name}' not found`,
      };
    }

    try {
      this.logger.log(`Executing tool: ${name}`);
      const result = await tool.handler(args, context);
      this.logger.log(`Tool ${name} executed: ${result.success ? 'success' : 'failed'}`);
      return result;
    } catch (error) {
      this.logger.error(`Tool ${name} error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error executing tool: ${(error as Error).message}`,
      };
    }
  }

}
