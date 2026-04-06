import { InjectModel, InjectConnection } from '@nestjs/sequelize';
/**
 * ============================================================================
 * AI TOOL SERVICE
 * ============================================================================
 *
 * Service untuk mengeksekusi AI tools dengan integrasi database dan LLM.
 * Menggantikan AIToolService.js dari old project.
 *
 * Beberapa method menggunakan LLM untuk memproses data:
 * - searchKnowledgeBase: Menggunakan "Agent Cari Pengetahuan Dasar"
 * - getAIShowGoldPrice: Menggunakan "Agent Menampilkan List Product" untuk generate SQL
 * - getAIShowGoldNameVariant: Menggunakan "Agent Menampilkan Varian"
 * - getAIShowGoldImage: Menggunakan "Agent Menampilkan Gambar"
 * - getAIProductBudget: Menggunakan "Agent Budget"
 * - getOrderEmasDetail: Menggunakan "Agent Rincian Pesanan" untuk validasi
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Injectable, Logger } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';

import {
  Product,
  Cart,
  CartStatus,
  ChatUserComplain,
  UserNeedHelp,
  Personalization,
  ReminderProducts,
  AgentAI,
  StudioAI,
  ModelAI,
  MessageRole,
  MessageType,
  CostOperationType,
  Promo,
} from '../../../database/models';
import { KnowledgeBaseService } from '../../knowledge-base/services/knowledge-base.service';
import { KtpVerificationService } from '../../user/services/ktp-verification.service';
import { WhatsappApiService } from '../../whatsapp/services/whatsapp-api.service';
import { CompletionRequest, ChatMessage } from '../providers/base.provider';
import { XenditService } from '../../order/services/xendit.service';
import { PromoService } from '../../order/services/promo.service';
import { OrderService } from '../../order/services/order.service';
import { CartService } from '../../order/services/cart.service';
import { ChatService } from '../../chat/services/chat.service';
import { CostTrackingService } from './cost-tracking.service';
import { AiProviderFactory } from './ai-provider.factory';

export interface ToolContext {
  userPhone: string;
  userName: string;
  userId: number;
  messageId: string;
  replyMessageId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface ToolResult {
  success: boolean;
  data: any;
  message: string;
  skipLLM?: boolean; // Flag untuk indicate langsung kirim WA tanpa LLM
}

@Injectable()
export class AiToolService {
  private readonly logger = new Logger(AiToolService.name);

  constructor(
    @InjectModel(Product)
    private readonly productModel: typeof Product,
    @InjectModel(Cart)
    private readonly cartModel: typeof Cart,
    @InjectModel(ChatUserComplain)
    private readonly complainModel: typeof ChatUserComplain,
    @InjectModel(UserNeedHelp)
    private readonly needHelpModel: typeof UserNeedHelp,
    @InjectModel(Personalization)
    private readonly personalizationModel: typeof Personalization,
    @InjectModel(ReminderProducts)
    private readonly reminderModel: typeof ReminderProducts,
    @InjectModel(AgentAI)
    private readonly agentModel: typeof AgentAI,
    @InjectModel(StudioAI)
    private readonly studioModel: typeof StudioAI,
    @InjectModel(ModelAI)
    private readonly modelAiModel: typeof ModelAI,
    @InjectModel(Promo)
    private readonly promoModel: typeof Promo,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly xenditService: XenditService,
    private readonly promoService: PromoService,
    private readonly whatsappApi: WhatsappApiService,
    private readonly chatService: ChatService,
    private readonly providerFactory: AiProviderFactory,
    private readonly costTracking: CostTrackingService,
    private readonly ktpVerificationService: KtpVerificationService,
  ) {}

  /**
   * Extract common gold-related keywords from user request for fallback search.
   */
  private extractGoldKeywords(userRequest: string): string[] {
    const keywords: string[] = [];
    const normalized = userRequest.toLowerCase();

    // Brand/Type keywords
    if (normalized.includes('ubs')) keywords.push('UBS');
    if (normalized.includes('antam')) keywords.push('Antam');
    if (normalized.includes('lotus')) keywords.push('Lotus');
    if (normalized.includes('king halim')) keywords.push('King Halim');
    if (normalized.includes('emas')) keywords.push('Emas');
    if (normalized.includes('perak')) keywords.push('Perak');
    if (normalized.includes('lm')) keywords.push('LM');
    if (normalized.includes('logam mulia')) keywords.push('Logam Mulia');

    // Purity keywords
    if (normalized.includes('9999') || normalized.includes('99.99')) keywords.push('9999', '99.99');
    if (normalized.includes('916') || normalized.includes('91.6')) keywords.push('916', '91.6');
    if (normalized.includes('375') || normalized.includes('37.5')) keywords.push('375', '37.5');

    return keywords;
  }

  /**
   * Parse quantity manual dari pesan user.
   * Contoh: "1gr5keping" → 5, "ubs 1 gram 3 keping" → 3
   */
  private parseManualQuantity(normalizedMessage: string): number | null {
    const qtyMatch = normalizedMessage.match(/(\d+)\s*(?:keping|pcs|biji|buah|lembar)/);
    if (qtyMatch) {
      return parseInt(qtyMatch[1], 10);
    }
    return null;
  }

  /**
   * Ekstrak order manual dari pesan user menggunakan keyword matching.
   * Return null jika tidak ada produk yang cocok.
   */
  private extractOrderManually(message: string, allProducts: any[]) {
    const normalized = message
      .toLowerCase()
      .replace(/(\d)([a-zA-Z])/g, '$1 $2')
      .replace(/([a-zA-Z])(\d)/g, '$1 $2');

    const matches = allProducts.filter(
      (p) =>
        normalized.includes(p.product_name.toLowerCase()) ||
        (p.variant_name && normalized.includes(p.variant_name.toLowerCase())),
    );

    if (matches.length === 0) return null;

    // Pilih produk dengan match terpanjang (paling spesifik)
    const bestProduct = matches.reduce((best, current) => {
      const bestScore = best.product_name.length + (best.variant_name?.length || 0);
      const currentScore = current.product_name.length + (current.variant_name?.length || 0);
      return currentScore > bestScore ? current : best;
    });

    const denomMatch = normalized.match(/(\d+)\s*(?:gr|gram)/);
    const qtyMatch = normalized.match(/(\d+)\s*(?:keping|pcs|biji|buah|lembar)/);
    const requestedDenom = denomMatch ? parseInt(denomMatch[1], 10) : null;
    const requestedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    let finalProduct = bestProduct;
    if (requestedDenom) {
      const exactDenom = matches.find((p: any) => p.denomination == requestedDenom);
      if (exactDenom) finalProduct = exactDenom;
    }

    return [
      {
        product_name: finalProduct.product_name,
        variant_name: finalProduct.variant_name || undefined,
        denomination: requestedDenom || finalProduct.denomination,
        quantity: requestedQty,
      },
    ];
  }

  /**
   * ==========================================================================
   * RESOLVE MODEL CONFIG
   * ==========================================================================
   * Resolve model name, model id, dan provider dari agent.
   * Priority: hybrid_model_id -> model_id.
   */
  private async resolveModelConfig(
    agent: AgentAI | null,
    preferMainModel: boolean = false,
  ): Promise<{
    modelName: string;
    modelId: number;
    providerType: import('./ai-provider.factory').AiProviderType;
  }> {
    if (!agent) {
      return { modelName: 'gpt-4o-mini', modelId: 0, providerType: 'openai' };
    }

    // 1. Coba hybrid model dulu (kecuali kalau preferMainModel = true)
    if (!preferMainModel && agent.hybrid_model_id) {
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
        return {
          modelName: hybridModel.model,
          modelId: hybridModel.id,
          providerType: this.mapStudioToProvider(hybridModel.studio.studio),
        };
      }
    }

    // 2. Fallback ke main model
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

    if (mainModel?.studio) {
      return {
        modelName: mainModel.model,
        modelId: mainModel.id,
        providerType: this.mapStudioToProvider(mainModel.studio.studio),
      };
    }

    return { modelName: 'gpt-4o-mini', modelId: 0, providerType: 'openai' };
  }

  /**
   * ==========================================================================
   * GET AGENT BY NAME
   * ==========================================================================
   */
  private async getAgent(name: string): Promise<AgentAI | null> {
    const studio = await this.studioModel.findOne({ where: { is_used: '1' } });
    if (!studio) return null;

    return this.agentModel.findOne({
      where: { name, studio_id: studio.id },
    });
  }

  /**
   * ==========================================================================
   * CALL AI PROVIDER
   * ==========================================================================
   */
  private async callAI(
    request: CompletionRequest,
    agent: AgentAI | null,
    userId: number,
    waMessageId: string,
    toolSuffix: string = '',
  ): Promise<any> {
    let modelConfig = await this.resolveModelConfig(agent);
    const provider = this.providerFactory.getProvider(modelConfig.providerType);

    const startTime = Date.now();
    let completion;

    try {
      completion = await provider.createCompletion(request);
    } catch (error) {
      const errMsg = (error as Error).message || '';
      const isFallbackable =
        errMsg.includes('429') ||
        errMsg.includes('Rate limit') ||
        errMsg.includes('rate limit') ||
        errMsg.includes('capacity') ||
        errMsg.includes('overloaded') ||
        errMsg.includes('temporarily unavailable');

      if (isFallbackable && agent?.model_id && agent.model_id !== agent.hybrid_model_id) {
        this.logger.warn(
          `Hybrid model failed for agent ${agent.name}: ${errMsg}. Falling back to main model.`,
        );
        modelConfig = await this.resolveModelConfig(agent, true);
        const fallbackProvider = this.providerFactory.getProvider(modelConfig.providerType);
        completion = await fallbackProvider.createCompletion({
          ...request,
          model: modelConfig.modelName,
        });
      } else {
        throw error;
      }
    }

    const costTrackingMessageId = toolSuffix ? `${waMessageId}_${toolSuffix}` : waMessageId;

    await this.costTracking.trackCost(
      completion,
      agent?.id || null,
      userId,
      costTrackingMessageId,
      request.messages,
      Date.now() - startTime,
      modelConfig.modelId,
      CostOperationType.TOOL_EXECUTION,
    );

    return completion;
  }

  /**
   * ==========================================================================
   * MAP STUDIO TO PROVIDER
   * ==========================================================================
   */
  private mapStudioToProvider(studio: string): import('./ai-provider.factory').AiProviderType {
    const mapping: Record<string, import('./ai-provider.factory').AiProviderType> = {
      openai: 'openai',
      groq: 'groq',
      deepseek: 'deepseek',
      openrouter: 'openrouter',
      grok: 'grok',
      cerebras: 'cerebras',
      bailian: 'bailian',
    };
    return mapping[studio.toLowerCase()] || 'openai';
  }

  /**
   * ==========================================================================
   * SEARCH KNOWLEDGE BASE
   * ==========================================================================
   */
  async searchKnowledgeBase(
    query: string,
    keyword: string[],
    context: ToolContext,
  ): Promise<ToolResult> {
    try {
      this.logger.log(`Searching knowledge base: ${query}`);

      const sourceKnowledgeBase = await this.knowledgeBaseService.searchKnowledgeBase(keyword);

      if (!sourceKnowledgeBase || sourceKnowledgeBase.length === 0) {
        return {
          success: true,
          data: null,
          message: 'Tidak ditemukan informasi terkait di knowledge base.',
        };
      }

      const agent = await this.getAgent('Agent Cari Pengetahuan Dasar');
      if (!agent) {
        return {
          success: true,
          data: sourceKnowledgeBase,
          message: sourceKnowledgeBase,
        };
      }

      const parameters = agent.parameters ? JSON.parse(agent.parameters) : {};

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `${agent.instruction}

###Basis Pengetahuan Bisnis ###
${sourceKnowledgeBase}`,
        },
        {
          role: 'user',
          content: `Pertanyaan:${query}`,
        },
      ];

      const completion = await this.callAI(
        {
          model: (await this.resolveModelConfig(agent)).modelName,
          messages,
          ...parameters,
        },
        agent,
        context.userId,
        context.messageId,
        'kb',
      );

      const content = completion.choices[0]?.message?.content || '';

      return {
        success: true,
        data: content,
        message: content,
      };
    } catch (error) {
      this.logger.error(`Search knowledge base error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * GET GOLD INFO
   * ==========================================================================
   */
  async getGoldInfo(
    action: 'variant' | 'list' | 'image',
    userRequest: string,
    context: ToolContext,
  ): Promise<ToolResult> {
    try {
      this.logger.log(`Getting gold info: ${action} - ${userRequest}`);

      switch (action) {
        case 'list':
          return this.getAIShowGoldPrice(userRequest, context);

        case 'variant':
          return this.getAIShowGoldNameVariant(userRequest, context);

        case 'image':
          return this.getAIShowGoldImage(userRequest, context);

        default:
          return {
            success: false,
            data: null,
            message: 'Action tidak valid',
          };
      }
    } catch (error) {
      this.logger.error(`Get gold info error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * GET AI SHOW GOLD PRICE
   * ==========================================================================
   */
  private async getAIShowGoldPrice(userRequest: string, context: ToolContext): Promise<ToolResult> {
    try {
      const agent = await this.getAgent('Agent Menampilkan List Product');

      const products = await this.productModel.findAll({
        attributes: ['product_name', 'variant_name'],
        raw: true,
      });
      const productNames = [...new Set(products.map((p: any) => p.product_name))];
      const variantNames = [...new Set(products.map((p: any) => p.variant_name))];

      const parameters = agent?.parameters ? JSON.parse(agent.parameters) : {};

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `Data Nama Product:${productNames.join(', ')}.
Data Variant Product:${variantNames.join(', ')}.

${agent?.instruction || ''}`,
        },
        {
          role: 'user',
          content: `${userRequest}. Cari produk yang ada stoknya.`,
        },
      ];

      const completion = await this.callAI(
        {
          model: (await this.resolveModelConfig(agent)).modelName,
          messages,
          ...parameters,
        },
        agent,
        context.userId,
        context.messageId,
        'gold_list',
      );

      let query = completion.choices[0]?.message?.content || '';
      query = query
        .replace(/```sql/g, '')
        .replace(/```/g, '')
        .replace(/\n/g, ' ')
        .trim();

      // Hanya hapus tanda kurung luar jika seluruh query di-wrap dalam SATU pasang ()
      // Contoh: "(SELECT ... UNION ALL SELECT ...)" → "SELECT ... UNION ALL SELECT ..."
      if (query.startsWith('(') && query.endsWith(')')) {
        let openCount = 0;
        let isWrapped = false;
        for (let i = 0; i < query.length; i++) {
          if (query[i] === '(') openCount++;
          else if (query[i] === ')') openCount--;

          // Jika counter kembali ke 0 sebelum akhir string, berarti ada multiple ()
          if (openCount === 0 && i < query.length - 1) {
            isWrapped = false;
            break;
          }
          if (openCount === 0 && i === query.length - 1) {
            isWrapped = true;
          }
        }
        if (isWrapped) {
          query = query.slice(1, -1).trim();
        }
      }

      let results: Product[] = [];

      try {
        const normalizedQuery = query.replace(/\s+/g, ' ').trim().toLowerCase();
        const isSelectQuery =
          normalizedQuery.startsWith('select') ||
          normalizedQuery.startsWith('(select') ||
          normalizedQuery.startsWith('with') ||
          normalizedQuery.startsWith('(with');

        if (isSelectQuery) {
          this.logger.log(`Executing gold price query: ${query.substring(0, 200)}...`);
          const [queryResults] = (await this.productModel.sequelize?.query(query)) || [[]];
          results = queryResults as Product[];
          this.logger.log(`Gold price query returned ${results.length} rows`);
        } else {
          throw new Error('Not a valid SQL query');
        }
      } catch (error) {
        this.logger.warn(
          `Gold price query failed: ${(error as Error).message}. Falling back to default search.`,
        );
      }

      // Fallback 1: default search with user request
      if (results.length === 0) {
        results = await this.productModel.findAll({
          where: {
            max_quantity: { [Op.gt]: 0 },
            [Op.or]: [
              { product_name: { [Op.like]: `%${userRequest}%` } },
              { variant_name: { [Op.like]: `%${userRequest}%` } },
            ],
          },
          limit: 20,
        });
        this.logger.log(`Fallback 1 (default search) returned ${results.length} rows`);
      }

      // Fallback 2: keyword-based search for common gold terms
      if (results.length === 0) {
        const keywords = this.extractGoldKeywords(userRequest);
        if (keywords.length > 0) {
          results = await this.productModel.findAll({
            where: {
              max_quantity: { [Op.gt]: 0 },
              [Op.or]: keywords.map((kw) => ({
                [Op.or]: [
                  { product_name: { [Op.like]: `%${kw}%` } },
                  { variant_name: { [Op.like]: `%${kw}%` } },
                ],
              })),
            },
            limit: 20,
          });
          this.logger.log(
            `Fallback 2 (keyword search: ${keywords.join(', ')}) returned ${results.length} rows`,
          );
        }
      }

      // Fallback 3: return all gold products with stock
      if (results.length === 0) {
        results = await this.productModel.findAll({
          where: {
            max_quantity: { [Op.gt]: 0 },
            [Op.or]: [
              { product_name: { [Op.like]: '%Emas%' } },
              { product_name: { [Op.like]: '%LM%' } },
              { product_name: { [Op.like]: '%UBS%' } },
              { product_name: { [Op.like]: '%Perak%' } },
            ],
          },
          limit: 20,
        });
        this.logger.log(`Fallback 3 (all gold products) returned ${results.length} rows`);
      }

      const priceList = results.map((p) => ({
        name: `${p.product_name} ${p.variant_name}`,
        denomination: p.denomination,
        price: p.price,
        available: p.max_quantity > 0,
      }));

      if (priceList.length === 0) {
        return {
          success: true,
          data: [],
          message: `Saat ini tidak ada produk yang tersedia untuk "${userRequest}". Silakan coba kata kunci lain atau tanyakan produk lainnya.`,
        };
      }

      return {
        success: true,
        data: priceList,
        message: `Ditemukan ${priceList.length} produk untuk "${userRequest}":\n${priceList.map((p, i) => `${i + 1}. ${p.name} - ${p.denomination}g - Rp ${p.price.toLocaleString('id-ID')}`).join('\n')}`,
      };
    } catch (error) {
      this.logger.error(`Get AI show gold price error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * GET AI SHOW GOLD NAME VARIANT
   * ==========================================================================
   */
  private async getAIShowGoldNameVariant(
    userRequest: string,
    context: ToolContext,
  ): Promise<ToolResult> {
    try {
      const agent = await this.getAgent('Agent Menampilkan Varian');

      const products = await this.productModel.findAll({
        attributes: ['product_name', 'variant_name', 'denomination', 'price'],
        where: { max_quantity: { [Op.gt]: 0 } },
        raw: true,
      });

      if (agent) {
        const parameters = agent.parameters ? JSON.parse(agent.parameters) : {};

        const messages: ChatMessage[] = [
          {
            role: 'system',
            content: `${agent.instruction}

Data Produk:\n${JSON.stringify(products, null, 2)}`,
          },
          {
            role: 'user',
            content: userRequest,
          },
        ];

        const completion = await this.callAI(
          {
            model: (await this.resolveModelConfig(agent)).modelName,
            messages,
            ...parameters,
          },
          agent,
          context.userId,
          context.messageId,
          'gold_variant',
        );

        const content = completion.choices[0]?.message?.content || '';
        return {
          success: true,
          data: products,
          message: content,
        };
      }

      const variants = [...new Set(products.map((p: any) => p.variant_name))];
      return {
        success: true,
        data: variants,
        message: `Tersedia variant: ${variants.join(', ')}`,
      };
    } catch (error) {
      this.logger.error(`Get AI show gold variant error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * GET AI SHOW GOLD IMAGE
   * ==========================================================================
   */
  private async getAIShowGoldImage(userRequest: string, context: ToolContext): Promise<ToolResult> {
    try {
      const agent = await this.getAgent('Agent Menampilkan Gambar');

      const products = await this.productModel.findAll({
        where: {
          [Op.or]: [
            { product_name: { [Op.like]: `%${userRequest}%` } },
            { variant_name: { [Op.like]: `%${userRequest}%` } },
          ],
        },
        limit: 10,
      });

      if (agent && products.length > 0) {
        const parameters = agent.parameters ? JSON.parse(agent.parameters) : {};

        const messages: ChatMessage[] = [
          {
            role: 'system',
            content: agent.instruction,
          },
          {
            role: 'user',
            content: `User request: ${userRequest}\nAvailable products: ${JSON.stringify(products.map((p) => ({ name: p.product_name, variant: p.variant_name, image: p.image })))}`,
          },
        ];

        const completion = await this.callAI(
          {
            model: (await this.resolveModelConfig(agent)).modelName,
            messages,
            ...parameters,
          },
          agent,
          context.userId,
          context.messageId,
          'gold_image',
        );

        const content = completion.choices[0]?.message?.content || '';
        return {
          success: true,
          data: products.map((p) => ({
            name: `${p.product_name} ${p.variant_name}`,
            image: p.image,
            price: p.price,
          })),
          message: content,
        };
      }

      return {
        success: true,
        data: products,
        message:
          products.length > 0
            ? `Ditemukan ${products.length} produk dengan gambar`
            : 'Produk tidak ditemukan',
      };
    } catch (error) {
      this.logger.error(`Get AI show gold image error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * GET PRODUCT BUDGET
   * ==========================================================================
   */
  async getProductBudget(nominalBudget: number, context: ToolContext): Promise<ToolResult> {
    try {
      this.logger.log(`Getting product budget: ${nominalBudget}`);

      const products = await this.productModel.findAll({
        where: {
          price: { [Op.lte]: nominalBudget },
          max_quantity: { [Op.gt]: 0 },
        },
        order: [['price', 'DESC']],
      });

      if (products.length === 0) {
        return {
          success: true,
          data: [],
          message: `Tidak ada produk yang cocok dengan budget Rp ${nominalBudget.toLocaleString('id-ID')}`,
        };
      }

      const agent = await this.getAgent('Agent Product Sesuai Budget');
      const combinations = this.calculateBudgetCombinations(products, nominalBudget);

      if (agent) {
        const parameters = agent.parameters ? JSON.parse(agent.parameters) : {};

        const messages: ChatMessage[] = [
          {
            role: 'system',
            content: `${agent.instruction}

Budget: Rp ${nominalBudget.toLocaleString('id-ID')}
Available Products: ${JSON.stringify(products.map((p) => ({ name: `${p.product_name} ${p.variant_name}`, price: p.price })))}`,
          },
          {
            role: 'user',
            content: `Berikan rekomendasi kombinasi produk untuk budget Rp ${nominalBudget.toLocaleString('id-ID')}`,
          },
        ];

        const completion = await this.callAI(
          {
            model: (await this.resolveModelConfig(agent)).modelName,
            messages,
            ...parameters,
          },
          agent,
          context.userId,
          context.messageId,
          'budget',
        );

        const content = completion.choices[0]?.message?.content || '';
        return {
          success: true,
          data: combinations,
          message: content,
        };
      }

      return {
        success: true,
        data: combinations,
        message: `Ditemukan ${combinations.length} kombinasi produk untuk budget Rp ${nominalBudget.toLocaleString('id-ID')}`,
      };
    } catch (error) {
      this.logger.error(`Get product budget error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * GET ORDER EMAS DETAIL - LANGSUNG KIRIM WA
   * ==========================================================================
   * Menggunakan AI dengan instruksi dari agent_ai.instruction untuk ekstrak produk
   * dari history chat, kemudian langsung kirim WA
   */
  async getOrderEmasDetail(_args: any, context: ToolContext): Promise<ToolResult> {
    try {
      this.logger.log('Processing order with AI extraction using agent instruction');

      // 1. Gunakan conversation history dari context (sudah include pesan user terakhir)
      // JANGAN pakai getConversationHistory dari DB karena pesan terakhir belum is_llm_read=1
      const chatHistory = context.conversationHistory || [];
      this.logger.log(`Using ${chatHistory.length} messages from context conversation history`);

      // 2. Ambil Agent dan Instruksi dari database
      const agent = await this.getAgent('Agent Rincian Pesanan');
      if (!agent?.instruction) {
        this.logger.warn('Agent Rincian Pesanan tidak ditemukan atau tidak memiliki instruction');
        return {
          success: false,
          data: null,
          message: 'Maaf, sistem sedang dalam maintenance. Silakan coba lagi nanti.',
          skipLLM: true,
        };
      }

      // Ambil semua produk untuk referensi AI
      const allProducts = await this.productModel.findAll({
        attributes: ['product_name', 'variant_name', 'denomination', 'price', 'max_quantity'],
        where: { max_quantity: { [Op.gt]: 0 } },
        raw: true,
      });

      const parameters = agent?.parameters ? JSON.parse(agent.parameters) : {};

      // Identifikasi pesan terakhir
      const lastUserMessage =
        [...chatHistory].reverse().find((h) => h.role === 'user')?.content || '';

      let extractedProducts: Array<{
        product_name: string;
        variant_name?: string;
        denomination: number;
        quantity: number;
      }> = [];

      // ==========================================================
      // PRIMARY: Manual keyword extraction (lebih akurat & murah)
      // ==========================================================
      const manualExtracted = this.extractOrderManually(lastUserMessage, allProducts);
      if (manualExtracted) {
        this.logger.log(`Manual extraction found products: ${JSON.stringify(manualExtracted)}`);
        extractedProducts = manualExtracted;
      } else {
        // ==========================================================
        // FALLBACK: AI extraction untuk pesan kompleks/ambiguous
        // ==========================================================
        this.logger.log('Manual extraction failed, falling back to AI extraction');

        const isChangeRequest = /\b(ganti|ubah|gantiin|ganti jadi|ubah jadi|jadi)\b/i.test(
          lastUserMessage,
        );
        const normalizedLastMessage = lastUserMessage
          .toLowerCase()
          .replace(/(\d)([a-zA-Z])/g, '$1 $2')
          .replace(/([a-zA-Z])(\d)/g, '$1 $2');

        const systemPrompt = `
Kamu adalah ekstraktor pesanan emas. Tugasmu adalah mengidentifikasi produk emas dari percakapan user, bahkan jika ada typo atau spasi yang hilang.
Contoh normalisasi:
- "1gr5keping" → "1 gr 5 keping"
- "ubs1gram" → "ubs 1 gram"
- "antam2gr" → "antam 2 gr"
Selalu cocokkan nama produk dengan "Data Produk Tersedia" di bawah. Jika user tidak menyebutkan variant, kosongkan variant_name. Jika user tidak menyebutkan quantity, default 1.
${isChangeRequest ? '\nPERHATIAN: User ingin MENGUBAH pesanan sebelumnya. Gunakan HANYA pesan terakhir dari user untuk ekstrak produk dan quantity. Abaikan semua pesan dan quantity sebelumnya.\n' : ''}

${agent.instruction || ''}

Data Produk Tersedia (untuk referensi):
${JSON.stringify(
  allProducts.map((p: any) => ({
    name: p.product_name,
    variant: p.variant_name,
    weight: p.denomination,
    price: p.price,
  })),
)}`;

        const extractionMessages: ChatMessage[] = [
          { role: 'system', content: systemPrompt },
          ...chatHistory.map((h) => ({ role: h.role as any, content: h.content })),
          {
            role: 'user',
            content: isChangeRequest
              ? `PESAN TERBARU INI ADALAH YANG PALING VALID: "${lastUserMessage}". Ekstrak HANYA dari pesan ini, abaikan semua pesan sebelumnya.`
              : 'Ekstrak produk yang ingin saya beli dari percakapan di atas dan kembalikan dalam format JSON sesuai instruksi.',
          },
        ];

        const extractionCompletion = await this.callAI(
          {
            model: (await this.resolveModelConfig(agent)).modelName,
            messages: extractionMessages,
            response_format: { type: 'json_object' },
            ...parameters,
          },
          agent,
          context.userId,
          context.messageId,
          'extract',
        );

        try {
          const aiResponse = extractionCompletion.choices[0]?.message?.content || '';
          this.logger.debug(`AI raw response: ${aiResponse}`);

          const parsedResponse = JSON.parse(aiResponse);

          if (parsedResponse.products && Array.isArray(parsedResponse.products)) {
            extractedProducts = parsedResponse.products;
          } else if (Array.isArray(parsedResponse)) {
            extractedProducts = parsedResponse;
          }

          extractedProducts = extractedProducts
            .map((p) => ({
              product_name: p.product_name || '',
              variant_name: p.variant_name || undefined,
              denomination: p.denomination || 0,
              quantity: p.quantity || 1,
            }))
            .filter((p) => p.product_name);

          this.logger.log(`AI extracted products: ${JSON.stringify(extractedProducts)}`);

          const manualQty = this.parseManualQuantity(normalizedLastMessage);
          if (manualQty !== null && extractedProducts.length > 0) {
            const aiQty = extractedProducts[0]?.quantity || 1;
            if (aiQty !== manualQty) {
              this.logger.log(
                `Overriding AI quantity ${aiQty} with manual parse quantity ${manualQty}`,
              );
              extractedProducts = extractedProducts.map((p) => ({ ...p, quantity: manualQty }));
            }
          }
        } catch (parseError) {
          this.logger.warn(`Failed to parse AI extraction: ${(parseError as Error).message}`);
          extractedProducts = [];
        }
      }

      // Kalau masih kosong, jangan kirim error kaku langsung ke WA. Biarkan LLM utama yang respon.
      if (!extractedProducts || extractedProducts.length === 0) {
        return {
          success: false,
          data: null,
          message:
            'Pesanan user tidak bisa saya identifikasi dengan pasti. Mohon bantu tanyakan kembali produk apa yang dimaksud dengan format yang lebih jelas (contoh: "Pesan UBS 1gr 5 keping").',
          skipLLM: false,
        };
      }

      // 3. Validate products against database
      const validatedProducts: Array<{
        product_name: string;
        variant_name?: string;
        denomination: number;
        quantity: number;
        actual_product_name?: string;
        actual_variant_name?: string;
        price?: number;
        product_id?: number;
      }> = [];
      const wrongProducts: typeof extractedProducts = [];

      for (const item of extractedProducts) {
        // Build where clause - handle null denomination (user didn't specify weight)
        const whereClause: any = {
          product_name: { [Op.like]: `%${item.product_name}%` },
          max_quantity: { [Op.gte]: item.quantity },
        };

        // Add variant filter if provided
        if (item.variant_name) {
          whereClause.variant_name = { [Op.like]: `%${item.variant_name}%` };
        }

        // Handle denomination - if null, find smallest available
        if (item.denomination && item.denomination > 0) {
          whereClause.denomination = item.denomination;
        }

        let product = await this.productModel.findOne({
          where: whereClause,
          order: [['denomination', 'ASC']], // Prioritize smallest denomination if not specified
        });

        // If exact denomination not found, try to find closest denomination
        if (!product && item.denomination && item.denomination > 0) {
          product = await this.productModel.findOne({
            where: {
              ...whereClause,
              denomination: { [Op.ne]: null },
            },
            order: [
              // Order by closest denomination to requested
              [this.sequelize.literal(`ABS(denomination - ${item.denomination})`), 'ASC'],
            ],
          });
        }

        if (product) {
          validatedProducts.push({
            ...item,
            denomination: product.denomination, // Use actual denomination from DB
            actual_product_name: product.product_name,
            actual_variant_name: product.variant_name,
            price: product.price,
            product_id: product.id,
          });
        } else {
          wrongProducts.push(item);
        }
      }

      // Cek apakah sudah ada cart pending terbaru dalam 10 menit terakhir
      // untuk menghindari duplikasi cart saat user mengirim pesan lanjutan
      const recentPendingCart = await this.cartModel.findOne({
        where: {
          user_id: context.userId,
          status_order: CartStatus.PENDING,
        },
        order: [['timestamp', 'DESC']],
      });

      const TEN_MINUTES = 10 * 60 * 1000;
      const isRecentCart =
        recentPendingCart &&
        new Date().getTime() - new Date(recentPendingCart.timestamp).getTime() < TEN_MINUTES;

      // 2. Jika ada valid products, create cart dan kirim WA langsung
      // Apply promo ke validated products
      if (validatedProducts.length > 0) {
        const usedSinglePromoIds = new Set<number>();

        for (const item of validatedProducts) {
          const originalPrice = item.price!;
          const promoResult = await this.promoService.findBestPromoForProduct(
            {
              product_id: item.product_id!,
              product_name: item.actual_product_name!,
              variant_name: item.actual_variant_name,
              quantity: item.quantity,
              price: originalPrice,
            },
            context.userId,
          );

          if (promoResult && promoResult.discountAmount > 0) {
            // Kalau promo single product dan sudah dipakai untuk produk lain, skip
            if (promoResult.isSingleProduct && usedSinglePromoIds.has(promoResult.promoId)) {
              this.logger.log(
                `Skipping single product promo ${promoResult.promoName} for product ${item.product_id} (already used)`,
              );
              continue;
            }

            (item as any).original_price = originalPrice;
            item.price = promoResult.finalAmount / item.quantity; // Harga setelah promo per unit
            (item as any).promo_info = {
              promoName: promoResult.promoName,
              discountAmount: promoResult.discountAmount,
            };

            if (promoResult.isSingleProduct) {
              usedSinglePromoIds.add(promoResult.promoId);
            }

            this.logger.log(
              `Promo applied for user ${context.userId} product ${item.product_id}: ${promoResult.promoName}, discount=${promoResult.discountAmount}`,
            );
          }
        }
      }

      if (validatedProducts.length > 0) {
        let cart;
        if (isRecentCart) {
          this.logger.log(
            `Reusing recent pending cart ${recentPendingCart.id} instead of creating new cart`,
          );
          // Update cart yang sudah ada dengan produk baru
          await this.cartModel.update(
            {
              json_order: validatedProducts.map((p: any) => ({
                product_id: p.product_id!,
                product_name: p.actual_product_name!,
                variant_id: 0,
                variant_name: p.actual_variant_name || '',
                quantity: p.quantity,
                denomination: p.denomination,
                max_quantity: 100,
                price: p.original_price || p.price!,
                discount_price: p.original_price ? p.price! : 0,
                is_po: 0,
                automatic_po: 0,
                est_date_po: 0,
                stock_po: 0,
              })),
              wa_message_id: context.messageId,
            },
            { where: { id: recentPendingCart.id } },
          );
          cart = await this.cartModel.findByPk(recentPendingCart.id);
        } else {
          cart = await this.cartService.createCart({
            user_id: context.userId,
            products: validatedProducts.map((p: any) => ({
              product_id: p.product_id!,
              product_name: p.actual_product_name!,
              variant_id: 0,
              variant_name: p.actual_variant_name || '',
              quantity: p.quantity,
              denomination: p.denomination,
              max_quantity: 100,
              price: p.original_price || p.price!,
              discount_price: p.original_price ? p.price! : 0,
              is_po: 0,
              automatic_po: 0,
              est_date_po: 0,
              stock_po: 0,
            })),
            wa_message_id: context.messageId,
          });
        }

        // Format dan kirim pesan rincian ke WhatsApp
        const message = this.formatOrderDetailMessage(validatedProducts);

        // Kirim dengan tombol interactive
        const response = await this.whatsappApi.sendMessage({
          type: 'interactive',
          to: context.userPhone,
          data: {
            text: message,
            interactive: {
              model: 'reply buttons',
              buttons: [
                { type: 'reply', reply: { id: `confirm_${cart.id}`, title: 'Lanjut' } },
                { type: 'reply', reply: { id: `cancel_${cart.id}`, title: 'Tidak' } },
              ],
            },
          },
        });

        // Update cart dengan wa_message_id dari pesan rincian
        const detailMessageId = response.messages[0]?.id;
        if (detailMessageId) {
          await this.cartModel.update(
            { wa_message_id: detailMessageId },
            { where: { id: cart.id } },
          );

          // Simpan ke chat history
          await this.chatService.saveMessage({
            user_id: context.userId,
            wa_message_id: detailMessageId,
            message: message,
            role: MessageRole.ASSISTANT,
            type: MessageType.INTERACTIVE,
          });
        }

        return {
          success: true,
          data: { cart_id: cart.id },
          message: 'Rincian pesanan telah dikirim ke WhatsApp',
          skipLLM: true, // Skip LLM, langsung kirim WA
        };
      }

      // 3. Jika tidak ada valid products, cari alternatif dan kirim WA langsung
      const alternatives = await this.findAlternativeProducts(wrongProducts);
      const failMessage = this.formatOrderFailedMessage(wrongProducts, alternatives);

      await this.whatsappApi.sendMessage({
        type: 'text',
        to: context.userPhone,
        data: { text: failMessage },
      });

      return {
        success: false,
        data: { invalid_products: wrongProducts, alternatives },
        message: failMessage,
        skipLLM: true, // Skip LLM, langsung kirim WA
      };
    } catch (error) {
      this.logger.error(`Get order detail error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * FORMAT ORDER DETAIL MESSAGE
   * ==========================================================================
   */
  private formatOrderDetailMessage(
    products: Array<{
      actual_product_name?: string;
      actual_variant_name?: string;
      denomination: number;
      quantity: number;
      price?: number;
      original_price?: number;
      promo_info?: { promoName: string; discountAmount: number } | null;
    }>,
  ): string {
    let message = '*Rincian Pesanan Anda:*\n\n';
    let totalPrice = 0;
    let totalDiscount = 0;

    products.forEach((p, index) => {
      const originalSubtotal = (p.original_price || p.price || 0) * p.quantity;
      const subtotal = (p.price || 0) * p.quantity;
      totalPrice += subtotal;
      if (p.promo_info) totalDiscount += p.promo_info.discountAmount;

      message += `*#${index + 1}*\n`;
      message += `Produk: ${p.actual_product_name}\n`;
      message += `Variant: ${p.actual_variant_name || '-'}\n`;
      message += `Berat: ${p.denomination} gram\n`;
      message += `Jumlah: ${p.quantity} keping\n`;
      if (p.promo_info) {
        message += `~Harga asli: Rp ${originalSubtotal.toLocaleString('id-ID')}~\n`;
        message += `*Harga promo (${p.promo_info.promoName}): Rp ${subtotal.toLocaleString('id-ID')}*\n`;
      } else {
        message += `Harga per unit: Rp ${(p.price || 0).toLocaleString('id-ID')}\n`;
        message += `Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n`;
      }
      message += `\n`;
    });

    if (totalDiscount > 0) {
      message += `Total Hemat: Rp ${totalDiscount.toLocaleString('id-ID')}\n`;
    }
    message += `*Total Harga: Rp ${totalPrice.toLocaleString('id-ID')}*\n\n`;
    message += `Apakah Anda ingin melanjutkan pesanan ini?\n`;
    message += `Balas dengan *Lanjut* untuk konfirmasi atau *Tidak* untuk membatalkan.`;

    return message;
  }

  /**
   * ==========================================================================
   * FORMAT ORDER FAILED MESSAGE
   * ==========================================================================
   */
  private formatOrderFailedMessage(
    invalidProducts: Array<{
      product_name: string;
      variant_name?: string;
      denomination: number;
      quantity: number;
    }>,
    alternatives: Array<{
      original: string;
      alternatives: Product[];
    }>,
  ): string {
    let message = '*Pesanan gagal diproses:*\n\n';

    invalidProducts.forEach((p, index) => {
      message += `*#${index + 1}*\n`;
      message += `Produk: ${p.product_name}\n`;
      message += `Variant: ${p.variant_name || '-'}\n`;
      message += `Berat: ${p.denomination} gram\n`;
      message += `Jumlah: ${p.quantity} keping\n`;
      message += `Keterangan: Produk tidak tersedia\n\n`;
    });

    if (alternatives.length > 0 && alternatives.some((a) => a.alternatives.length > 0)) {
      message += `*Alternatif Produk:*\n\n`;

      alternatives.forEach((alt) => {
        if (alt.alternatives.length > 0) {
          message += `${alt.original}:\n`;
          alt.alternatives.forEach((p, idx) => {
            message += `${idx + 1}. ${p.product_name} ${p.variant_name} ${p.denomination}g (harga: Rp ${p.price.toLocaleString('id-ID')})\n`;
          });
          message += '\n';
        }
      });
    }

    return message;
  }

  /**
   * ==========================================================================
   * FIND ALTERNATIVE PRODUCTS
   * ==========================================================================
   * Cari produk alternatif berdasarkan kemiripan nama/variant
   * Fallback ke range harga terdekat jika tidak ada yang mirip
   */
  private async findAlternativeProducts(
    products: Array<{
      product_name: string;
      variant_name?: string;
      denomination: number;
    }>,
  ): Promise<Array<{ original: string; alternatives: Product[] }>> {
    const results: Array<{ original: string; alternatives: Product[] }> = [];

    for (const item of products) {
      const originalName =
        `${item.product_name} ${item.variant_name || ''} ${item.denomination}g`.trim();

      // 1. Cari berdasarkan kemiripan nama produk
      let alternatives = await this.productModel.findAll({
        where: {
          max_quantity: { [Op.gt]: 0 },
          [Op.or]: [
            { product_name: { [Op.like]: `%${item.product_name}%` } },
            { variant_name: { [Op.like]: `%${item.variant_name || ''}%` } },
          ],
          denomination: item.denomination,
        },
        limit: 3,
      });

      // 2. Jika tidak ada, cari dengan denomination serupa
      if (alternatives.length === 0) {
        alternatives = await this.productModel.findAll({
          where: {
            max_quantity: { [Op.gt]: 0 },
            product_name: { [Op.like]: `%${item.product_name}%` },
            denomination: { [Op.between]: [item.denomination * 0.8, item.denomination * 1.2] },
          },
          order: [['denomination', 'ASC']],
          limit: 3,
        });
      }

      // 3. Fallback: cari berdasarkan range harga terdekat
      if (alternatives.length === 0) {
        // Asumsi harga emas ~1jt per gram untuk estimasi
        const estimatedPrice = item.denomination * 1000000;
        alternatives = await this.productModel.findAll({
          where: {
            max_quantity: { [Op.gt]: 0 },
            price: { [Op.between]: [estimatedPrice * 0.8, estimatedPrice * 1.2] },
          },
          order: [['price', 'ASC']],
          limit: 3,
        });
      }

      results.push({
        original: originalName,
        alternatives,
      });
    }

    return results;
  }

  /**
   * ==========================================================================
   * GET USER CONFIRM BUY
   * ==========================================================================
   * Handle tombol Lanjut dari WhatsApp
   */
  async getUserConfirmBuy(
    userAnswer: 'Lanjut' | 'Tidak',
    context: ToolContext,
  ): Promise<ToolResult> {
    try {
      this.logger.log(`User confirmation: ${userAnswer}`);

      if (userAnswer === 'Lanjut') {
        let cart = null;

        // 1. Coba cari cart berdasarkan replyMessageId (wa_message_id dari pesan rincian)
        if (context.replyMessageId) {
          cart = await this.cartModel.findOne({
            where: {
              wa_message_id: context.replyMessageId,
              user_id: context.userId,
              status_order: CartStatus.PENDING,
            },
          });
          this.logger.log(
            `Searching cart by replyMessageId: ${context.replyMessageId}, found: ${cart?.id}`,
          );
        }

        // 2. Jika tidak ketemu, cari cart pending terakhir untuk user ini
        if (!cart) {
          cart = await this.cartModel.findOne({
            where: {
              user_id: context.userId,
              status_order: CartStatus.PENDING,
            },
            order: [['timestamp', 'DESC']],
          });
          this.logger.log(`Searching cart by latest pending, found: ${cart?.id}`);
        }

        if (!cart) {
          const noCartMessage = 'Tidak ada keranjang aktif. Silakan buat pesanan baru.';
          const response = await this.whatsappApi.sendMessage({
            type: 'text',
            to: context.userPhone,
            data: { text: noCartMessage },
          });
          await this.chatService.saveMessage({
            user_id: context.userId,
            wa_message_id: response.messages[0]?.id,
            message: noCartMessage,
            role: MessageRole.ASSISTANT,
            type: MessageType.TEXT,
          });
          return {
            success: false,
            data: null,
            message: noCartMessage,
            skipLLM: true,
          };
        }

        // HARD GATE: Cek KTP verifikasi sebelum lanjut ke pembayaran
        const ktpVerification = await this.ktpVerificationService.findByUser(context.userId);
        this.logger.log(
          `KTP check for user ${context.userId}: ${ktpVerification ? 'found (id=' + ktpVerification.id + ')' : 'NOT FOUND'}`,
        );
        if (!ktpVerification) {
          const ktpMessage =
            'Sebelum melanjutkan ke pembayaran, mohon kirimkan foto KTP Anda terlebih dahulu ya. Setelah KTP terverifikasi, saya akan langsung mengirimkan link pembayarannya.';

          const response = await this.whatsappApi.sendMessage({
            type: 'text',
            to: context.userPhone,
            data: { text: ktpMessage },
          });

          await this.chatService.saveMessage({
            user_id: context.userId,
            wa_message_id: response.messages[0]?.id,
            message: ktpMessage,
            role: MessageRole.ASSISTANT,
            type: MessageType.TEXT,
          });

          return {
            success: false,
            data: null,
            message: ktpMessage,
            skipLLM: true,
          };
        }

        // Update cart status menjadi approved
        await this.cartModel.update(
          { status_order: CartStatus.APPROVED },
          { where: { id: cart.id } },
        );

        this.logger.log(`Cart ${cart.id} approved, creating payment link`);

        // 3. Hitung total amount dari cart
        const merchantAmount = this.calculateCartTotal(cart);
        if (merchantAmount <= 0) {
          const invalidCartMessage = 'Keranjang kosong atau total tidak valid.';
          const response = await this.whatsappApi.sendMessage({
            type: 'text',
            to: context.userPhone,
            data: { text: invalidCartMessage },
          });
          await this.chatService.saveMessage({
            user_id: context.userId,
            wa_message_id: response.messages[0]?.id,
            message: invalidCartMessage,
            role: MessageRole.ASSISTANT,
            type: MessageType.TEXT,
          });
          return {
            success: false,
            data: null,
            message: invalidCartMessage,
            skipLLM: true,
          };
        }

        // 4. Hitung platform fee
        const feeCalculation = this.calculatePlatformFee(merchantAmount);
        const totalAmount = feeCalculation.totalWithFee;

        this.logger.log(
          `Platform fee calculation: type=${feeCalculation.feeType}, ` +
            `merchantAmount=${merchantAmount}, fee=${feeCalculation.platformFee}, ` +
            `total=${totalAmount}`,
        );

        // 5. Generate external ID unik
        const externalId = `ORDER-${cart.id}-${Date.now()}`;

        // 6. Cek apakah ada Xendit Fee Rule ID
        const feeRuleId = process.env.XENDIT_FEE_RULE_ID;

        // 7. Buat Payment Link di Xendit
        let invoice;
        const invoiceItems = this.buildInvoiceItems(cart);

        if (feeRuleId) {
          // Gunakan Xendit Fee Rule (otomatis split ke Master Account)
          // Amount dikirim totalAmount (sudah include fee) supaya WA dan payment link konsisten
          this.logger.log(`Using Xendit Fee Rule: ${feeRuleId}`);

          invoice = await this.xenditService.createInvoiceWithFeeRule(
            {
              externalId,
              amount: totalAmount, // Total amount sudah include fee, Xendit akan split fee otomatis
              description: `Pembelian Emas - Order #${cart.id}`,
              payerEmail: 'customer@indogold.id',
              invoiceDuration: 86400,
              items: invoiceItems,
            },
            feeRuleId,
          );
        } else {
          // Fallback: Buat invoice manual dengan line item fee
          if (feeCalculation.platformFee > 0) {
            const feeItemName =
              feeCalculation.feeType === 'flat'
                ? 'Biaya Layanan'
                : `Biaya Layanan (${feeCalculation.feePercent}%)`;

            invoiceItems.push({
              name: feeItemName,
              quantity: 1,
              price: feeCalculation.platformFee,
            });
          }

          invoice = await this.xenditService.createInvoice({
            externalId,
            amount: totalAmount,
            description: `Pembelian Emas - Order #${cart.id}`,
            payerEmail: 'customer@indogold.id',
            invoiceDuration: 86400,
            items: invoiceItems,
          });
        }

        this.logger.log(`Xendit invoice created: ${invoice.id} - ${invoice.invoice_url}`);

        // 8. Buat Order dan Payment record
        const orderResult = await this.orderService.createOrderWithPaymentLink({
          cartId: cart.id,
          userId: context.userId,
          xenditInvoiceId: invoice.id,
          externalId,
          amount: totalAmount,
          invoiceUrl: invoice.invoice_url,
          expiryDate: new Date(invoice.expiry_date),
          items: invoiceItems,
          feeType: feeCalculation.feeType,
          platformFeeAmount: feeCalculation.platformFee,
          merchantAmount: feeCalculation.merchantAmount,
          feePercent: feeCalculation.feePercent,
          feeFlat: feeCalculation.feeFlat,
        });

        if (!orderResult.success) {
          const orderFailMessage = orderResult.message || 'Gagal membuat order.';
          const response = await this.whatsappApi.sendMessage({
            type: 'text',
            to: context.userPhone,
            data: { text: orderFailMessage },
          });
          await this.chatService.saveMessage({
            user_id: context.userId,
            wa_message_id: response.messages[0]?.id,
            message: orderFailMessage,
            role: MessageRole.ASSISTANT,
            type: MessageType.TEXT,
          });
          return {
            success: false,
            data: null,
            message: orderFailMessage,
            skipLLM: true,
          };
        }

        // Log promo usage jika ada promo yang di-apply
        try {
          const cartItems = this.parseCartItems(cart);
          const itemsWithDiscount = cartItems.filter((item) => item.discount_price > 0);
          if (itemsWithDiscount.length > 0) {
            const promoResult = await this.promoService.findBestPromoForCart(
              cartItems.map((item) => ({
                product_id: item.product_id,
                product_name: item.product_name,
                variant_name: item.variant_name || '',
                quantity: item.quantity,
                price: item.price,
              })),
              context.userId,
            );
            if (promoResult && promoResult.discountAmount > 0) {
              await this.promoService.logPromoUsage(
                promoResult.promoId,
                context.userId,
                orderResult.orderId!,
                promoResult.discountAmount,
              );
            }
          }
        } catch (promoLogError) {
          this.logger.warn(`Failed to log promo usage: ${(promoLogError as Error).message}`);
        }

        // 9. Kirim link pembayaran ke user
        const paymentMessage = this.formatPaymentLinkMessage({
          orderId: orderResult.orderId!,
          amount: totalAmount,
          expiryDate: new Date(invoice.expiry_date),
          paymentLink: invoice.invoice_url,
          merchantAmount: feeCalculation.merchantAmount,
          platformFee: feeCalculation.platformFee,
          feeType: feeCalculation.feeType,
          feePercent: feeCalculation.feePercent,
          hasFeeRule: !!feeRuleId,
        });

        // Kirim WhatsApp message
        const response = await this.whatsappApi.sendMessage({
          type: 'text',
          to: context.userPhone,
          data: { text: paymentMessage },
        });

        // Simpan ke chat history
        await this.chatService.saveMessage({
          user_id: context.userId,
          wa_message_id: response.messages[0]?.id,
          message: paymentMessage,
          role: MessageRole.ASSISTANT,
          type: MessageType.TEXT,
        });

        return {
          success: true,
          data: {
            order_id: orderResult.orderId,
            payment_link: invoice.invoice_url,
            action: 'payment_link_created',
          },
          message: paymentMessage,
          skipLLM: true, // Skip LLM, langsung kirim WA
        };
      } else {
        const cancelMessage =
          'Pesanan dibatalkan. Jika ingin memesan lagi, silakan informasikan produk yang diinginkan.';
        const response = await this.whatsappApi.sendMessage({
          type: 'text',
          to: context.userPhone,
          data: { text: cancelMessage },
        });
        await this.chatService.saveMessage({
          user_id: context.userId,
          wa_message_id: response.messages[0]?.id,
          message: cancelMessage,
          role: MessageRole.ASSISTANT,
          type: MessageType.TEXT,
        });
        return {
          success: true,
          data: { action: 'cancel' },
          message: cancelMessage,
          skipLLM: true,
        };
      }
    } catch (error) {
      this.logger.error(`User confirm buy error: ${(error as Error).message}`);
      const errorMessage = `Maaf, terjadi kesalahan saat memproses konfirmasi Anda. Silakan coba lagi nanti.`;
      try {
        const response = await this.whatsappApi.sendMessage({
          type: 'text',
          to: context.userPhone,
          data: { text: errorMessage },
        });
        await this.chatService.saveMessage({
          user_id: context.userId,
          wa_message_id: response.messages[0]?.id,
          message: errorMessage,
          role: MessageRole.ASSISTANT,
          type: MessageType.TEXT,
        });
      } catch (sendErr) {
        this.logger.error(`Failed to send error message: ${(sendErr as Error).message}`);
      }
      return {
        success: false,
        data: null,
        message: errorMessage,
        skipLLM: true,
      };
    }
  }

  /**
   * ==========================================================================
   * CALCULATE CART TOTAL
   * ==========================================================================
   */
  private parseCartItems(cart: Cart): any[] {
    let orderItems: any[] = cart.json_order as any;
    if (typeof cart.json_order === 'string') {
      try {
        orderItems = JSON.parse(cart.json_order);
      } catch (e) {
        this.logger.error('Failed to parse json_order:', cart.json_order);
        return [];
      }
    }
    return Array.isArray(orderItems) ? orderItems : [];
  }

  private calculateCartTotal(cart: Cart): number {
    const orderItems = this.parseCartItems(cart);
    return orderItems.reduce((total: number, item: any) => {
      const price = item.discount_price > 0 ? item.discount_price : item.price;
      return total + price * item.quantity;
    }, 0);
  }

  /**
   * ==========================================================================
   * BUILD INVOICE ITEMS
   * ==========================================================================
   */
  private buildInvoiceItems(cart: Cart): Array<{ name: string; quantity: number; price: number }> {
    const orderItems = this.parseCartItems(cart);
    return orderItems.map((item: any) => ({
      name: `${item.product_name} ${item.variant_name} ${item.denomination}g`,
      quantity: item.quantity,
      price: item.discount_price > 0 ? item.discount_price : item.price,
    }));
  }

  /**
   * ==========================================================================
   * GET PLATFORM FEE CONFIG
   * ==========================================================================
   * Baca config platform fee dari environment
   */
  private getPlatformFeeConfig(): {
    type: string;
    percent: number;
    flat: number;
  } {
    return {
      type: process.env.PLATFORM_FEE_TYPE || 'percent',
      percent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '1.15'),
      flat: parseInt(process.env.PLATFORM_FEE_FLAT || '10000', 10),
    };
  }

  /**
   * ==========================================================================
   * CALCULATE PLATFORM FEE
   * ==========================================================================
   * Hitung platform fee berdasarkan tipe (percent atau flat)
   */
  private calculatePlatformFee(totalAmount: number): {
    platformFee: number;
    merchantAmount: number;
    totalWithFee: number;
    feeType: string;
    feePercent: number;
    feeFlat: number;
  } {
    const config = this.getPlatformFeeConfig();
    let platformFee = 0;

    if (config.type === 'flat') {
      platformFee = config.flat;
    } else {
      // percent (default)
      platformFee = Math.round((totalAmount * config.percent) / 100);
    }

    return {
      platformFee,
      merchantAmount: totalAmount,
      totalWithFee: totalAmount + platformFee,
      feeType: config.type,
      feePercent: config.percent,
      feeFlat: config.flat,
    };
  }

  /**
   * ==========================================================================
   * FORMAT PAYMENT LINK MESSAGE
   * ==========================================================================
   */
  private formatPaymentLinkMessage(params: {
    orderId: number;
    amount: number;
    expiryDate: Date;
    paymentLink: string;
    merchantAmount?: number;
    platformFee?: number;
    feeType?: string;
    feePercent?: number;
    hasFeeRule?: boolean;
  }): string {
    const formattedExpiry = params.expiryDate.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let breakdownText = '';
    let displayAmount: number;

    if (params.hasFeeRule) {
      // Xendit Fee Rule: customer hanya lihat subtotal produk, fee diserap merchant
      displayAmount = params.merchantAmount || params.amount;
    } else {
      // Manual fee: tampilkan breakdown biaya
      displayAmount = params.amount;
      if (params.merchantAmount && params.platformFee && params.platformFee > 0) {
        const formattedMerchantAmount = params.merchantAmount.toLocaleString('id-ID');
        const formattedPlatformFee = params.platformFee.toLocaleString('id-ID');

        if (params.feeType === 'flat') {
          breakdownText = `Subtotal Produk: Rp ${formattedMerchantAmount}\nBiaya Layanan: Rp ${formattedPlatformFee}\n`;
        } else {
          breakdownText = `Subtotal Produk: Rp ${formattedMerchantAmount}\nBiaya Layanan (${params.feePercent}%): Rp ${formattedPlatformFee}\n`;
        }
      }
    }

    const formattedAmount = displayAmount.toLocaleString('id-ID');

    return (
      `🛒 *Pesanan Berhasil Dibuat!*\n\n` +
      `Order ID: #${params.orderId}\n` +
      breakdownText +
      `*Total Bayar: Rp ${formattedAmount}*\n` +
      `Berlaku sampai: *${formattedExpiry}*\n\n` +
      `*Link Pembayaran:*\n` +
      `${params.paymentLink}\n\n` +
      `Silakan klik link di atas untuk melanjutkan pembayaran.\n` +
      `Anda dapat membayar menggunakan Virtual Account, QRIS, atau E-Wallet.\n\n` +
      `_Setelah pembayaran berhasil, Anda akan menerima kode OTP untuk pengambilan barang._`
    );
  }

  /**
   * ==========================================================================
   * GET USER COMPLAIN
   * ==========================================================================
   */
  async getUserComplain(
    assistantAnswer: string,
    issueCategory: string,
    context: ToolContext,
  ): Promise<ToolResult> {
    try {
      this.logger.log(`User complain: ${issueCategory}`);

      await this.complainModel.create({
        user_id: context.userId,
        category: issueCategory,
        message: context.conversationHistory?.slice(-1)[0]?.content || '',
        status: 'open',
        created_at: new Date(),
      });

      return {
        success: true,
        data: { category: issueCategory },
        message: assistantAnswer,
      };
    } catch (error) {
      this.logger.error(`User complain error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * GET PROMO
   * ==========================================================================
   */
  async getPromo(): Promise<ToolResult> {
    try {
      this.logger.log('Getting active promos from database');

      const now = new Date();

      const promos = await this.promoModel.findAll({
        where: {
          is_active: true,
          start_date: { [Op.lte]: now },
          end_date: { [Op.gte]: now },
        },
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'variant_name', 'denomination'],
            through: { attributes: [] },
          },
        ],
        order: [['end_date', 'ASC']],
      });

      if (promos.length === 0) {
        return {
          success: true,
          data: [],
          message: 'Saat ini belum ada promo yang aktif. Silakan cek kembali nanti ya!',
        };
      }

      const formattedPromos = promos.map((p: any) => {
        const discountText =
          p.discount_type === 'percentage'
            ? `${p.discount_value}%`
            : p.discount_type === 'fixed_amount'
              ? `Rp ${Number(p.discount_value).toLocaleString('id-ID')}`
              : 'Gratis Ongkir';

        const linkedProducts = p.products || p.Products || [];
        let applicableProducts = 'Berlaku untuk semua produk';

        if (!p.applies_to_all_products) {
          if (linkedProducts.length === 0) {
            applicableProducts = 'Berlaku untuk produk tertentu (hubungi CS untuk detail)';
          } else {
            // Kelompokkan by product_name, kumpulkan denomination unik
            const grouped = new Map<string, number[]>();
            linkedProducts.forEach((prod: any) => {
              const name = prod.product_name?.trim() || 'Produk';
              const denom = Number(prod.denomination) || 0;
              if (!grouped.has(name)) grouped.set(name, []);
              if (denom > 0 && !grouped.get(name)!.includes(denom)) {
                grouped.get(name)!.push(denom);
              }
            });

            const maxGroups = 3;
            const entries = Array.from(grouped.entries());
            const shown = entries.slice(0, maxGroups).map(([name, denoms]) => {
              const sortedDenoms = denoms
                .sort((a, b) => a - b)
                .map((d) => `${d}gr`)
                .join(', ');
              return denoms.length > 0 ? `${name} (${sortedDenoms})` : name;
            });
            const remaining = entries.length - maxGroups;

            applicableProducts =
              `Berlaku untuk: ${shown.join(', ')}` +
              (remaining > 0 ? `, dan ${remaining} produk lainnya` : '');
          }
        }

        return {
          name: p.name,
          description: p.description,
          discount: discountText,
          minPurchase:
            p.min_purchase_amount > 0
              ? `Rp ${Number(p.min_purchase_amount).toLocaleString('id-ID')}`
              : 'Tanpa minimal pembelian',
          validUntil: p.end_date,
          applicableProducts,
        };
      });

      const messageLines = [
        `🎉 *${promos.length} Promo Aktif Hari Ini* 🎉`,
        '',
        ...formattedPromos.map(
          (p, i) =>
            `*${i + 1}. ${p.name}*\n` +
            `${p.description}\n` +
            `Diskon: ${p.discount}\n` +
            `Minimal belanja: ${p.minPurchase}\n` +
            `${p.applicableProducts}\n` +
            `Berlaku s/d: ${new Date(p.validUntil).toLocaleDateString('id-ID')}`,
        ),
        '',
        'Promo akan langsung dipotong otomatis saat checkout ya! 🛒',
      ];

      return {
        success: true,
        data: formattedPromos,
        message: messageLines.join('\n'),
      };
    } catch (error) {
      this.logger.error(`Get promo error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * GET USER NEED HELP
   * ==========================================================================
   */
  async getUserNeedHelp(
    assistantAnswer: string,
    topic: string,
    context: ToolContext,
  ): Promise<ToolResult> {
    try {
      this.logger.log(`User need help: ${topic}`);

      await this.needHelpModel.create({
        user_id: context.userId,
        topic,
        status: 'pending',
        created_at: new Date(),
      });

      return {
        success: true,
        data: { topic },
        message: assistantAnswer,
      };
    } catch (error) {
      this.logger.error(`User need help error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * SET PERSONALIZATION
   * ==========================================================================
   */
  async setPersonalization(
    personality: string,
    assistantAnswer: string,
    context: ToolContext,
    nickname?: string,
    age?: number,
    occupation?: string,
    languageStyle?: string,
    interests?: string,
    notes?: string,
  ): Promise<ToolResult> {
    try {
      this.logger.log(`Setting personalization for user ${context.userId}`);

      const existing = await this.personalizationModel.findOne({
        where: { user_id: context.userId },
      });

      const payload: any = {
        user_id: context.userId,
        updated_at: new Date(),
      };

      if (personality !== undefined) payload.personality = personality;
      if (nickname !== undefined) payload.nickname = nickname;
      if (age !== undefined) payload.age = age;
      if (occupation !== undefined) payload.occupation = occupation;
      if (languageStyle !== undefined) payload.language_style = languageStyle;
      if (interests !== undefined) payload.interests = interests;
      if (notes !== undefined) payload.notes = notes;

      if (existing) {
        await existing.update(payload);
      } else {
        await this.personalizationModel.create(payload);
      }

      return {
        success: true,
        data: payload,
        message: assistantAnswer,
      };
    } catch (error) {
      this.logger.error(`Set personalization error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * SET PRODUCT REMINDER
   * ==========================================================================
   */
  async setProductReminder(query: string, context: ToolContext): Promise<ToolResult> {
    try {
      this.logger.log(`Setting product reminder: ${query}`);

      const parts = query.split(' ');
      const denomination = parseFloat(parts.find((p) => !isNaN(parseFloat(p))) || '0');
      const productName = parts[0] || '';
      const variantName = parts.slice(2).join(' ') || '';

      await this.reminderModel.create({
        user_id: context.userId,
        product_name: productName,
        variant_name: variantName,
        denomination,
        wa_message_id: context.messageId,
        created_at: new Date(),
      });

      return {
        success: true,
        data: { query },
        message: `Reminder untuk ${query} telah disimpan. Kami akan memberitahu Anda ketika produk tersedia.`,
      };
    } catch (error) {
      this.logger.error(`Set product reminder error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * IGNORE MESSAGE
   * ==========================================================================
   */
  async ignoreMessage(_query: string): Promise<ToolResult> {
    return {
      success: true,
      data: null,
      message: '',
    };
  }

  /**
   * ==========================================================================
   * REPLY IMMEDIATELY
   * ==========================================================================
   */
  async replyImmediately(assistantAnswer: string): Promise<ToolResult> {
    return {
      success: true,
      data: null,
      message: assistantAnswer,
    };
  }

  /**
   * ==========================================================================
   * CALCULATE BUDGET COMBINATIONS
   * ==========================================================================
   */
  private calculateBudgetCombinations(
    products: Product[],
    budget: number,
  ): Array<{ products: any[]; total: number }> {
    const combinations = [];
    let remainingBudget = budget;
    const selectedProducts = [];

    for (const product of products) {
      if (remainingBudget >= product.price) {
        const maxQty = Math.min(Math.floor(remainingBudget / product.price), product.max_quantity);

        if (maxQty > 0) {
          selectedProducts.push({
            product,
            quantity: maxQty,
          });
          remainingBudget -= product.price * maxQty;
        }
      }
    }

    if (selectedProducts.length > 0) {
      combinations.push({
        products: selectedProducts,
        total: budget - remainingBudget,
      });
    }

    return combinations;
  }
}
