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
  MessageRole,
  MessageType,
} from '../../../database/models';
import { KnowledgeBaseService } from '../../knowledge-base/services/knowledge-base.service';
import { WhatsappApiService } from '../../whatsapp/services/whatsapp-api.service';
import { CompletionRequest, ChatMessage } from '../providers/base.provider';
import { OrderService } from '../../order/services/order.service';
import { CartService } from '../../order/services/cart.service';
import { XenditService } from '../../order/services/xendit.service';
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
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly xenditService: XenditService,
    private readonly whatsappApi: WhatsappApiService,
    private readonly chatService: ChatService,
    private readonly providerFactory: AiProviderFactory,
    private readonly costTracking: CostTrackingService,
  ) {}

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
    agentName: string,
    userId: number,
    waMessageId: string,
    toolSuffix: string = '',
  ): Promise<any> {
    const studio = await this.studioModel.findOne({ where: { is_used: '1' } });
    if (!studio) throw new Error('No active studio');

    const providerType = this.mapStudioToProvider(studio.studio);
    const provider = this.providerFactory.getProvider(providerType);

    const startTime = Date.now();
    const completion = await provider.createCompletion(request);

    const agent = await this.getAgent(agentName);
    const costTrackingMessageId = toolSuffix ? `${waMessageId}_${toolSuffix}` : waMessageId;

    await this.costTracking.trackCost(
      completion,
      agent?.id || null,
      userId,
      costTrackingMessageId,
      request.messages,
      Date.now() - startTime,
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
          model: agent.model,
          messages,
          ...parameters,
        },
        'Agent Cari Pengetahuan Dasar',
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
          model: agent?.model || 'gpt-4o-mini',
          messages,
          ...parameters,
        },
        'Agent Menampilkan List Product',
        context.userId,
        context.messageId,
        'gold_list',
      );

      let query = completion.choices[0]?.message?.content || '';
      query = query
        .replace(/```sql/g, '')
        .replace(/```/g, '')
        .trim()
        .replace(/^\(|\)$/g, '')
        .trim();

      let results: Product[] = [];

      try {
        if (query.toLowerCase().startsWith('select')) {
          const [queryResults] = (await this.productModel.sequelize?.query(query)) || [[]];
          results = queryResults as Product[];
        } else {
          throw new Error('Not a valid SQL query');
        }
      } catch (error) {
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
      }

      const priceList = results.map((p) => ({
        name: `${p.product_name} ${p.variant_name}`,
        denomination: p.denomination,
        price: p.price,
        available: p.max_quantity > 0,
      }));

      return {
        success: true,
        data: priceList,
        message: `Ditemukan ${priceList.length} produk untuk "${userRequest}"`,
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
            model: agent.model,
            messages,
            ...parameters,
          },
          'Agent Menampilkan Varian',
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
            model: agent.model,
            messages,
            ...parameters,
          },
          'Agent Menampilkan Gambar',
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

      const agent = await this.getAgent('Agent Budget');
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
            model: agent.model,
            messages,
            ...parameters,
          },
          'Agent Budget',
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

      // 1. Ambil history chat terlebih dahulu (5 pesan terakhir)
      const chatHistory = await this.chatService.getConversationHistory(context.userId, 5);
      this.logger.log(`Retrieved ${chatHistory.length} messages from history`);

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

      // Build system prompt dengan instruksi dari database
      const systemPrompt = ` 
${agent.instruction}

Data Produk Tersedia (untuk referensi):
${JSON.stringify(
  allProducts.map((p: any) => ({
    name: p.product_name,
    variant: p.variant_name,
    weight: p.denomination,
    price: p.price,
  })),
)}`;

      // Build conversation untuk AI ekstraksi
      const extractionMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map((h) => ({ role: h.role as any, content: h.content })),
        {
          role: 'user',
          content:
            'Ekstrak produk yang ingin saya beli dari percakapan di atas dan kembalikan dalam format JSON sesuai instruksi.',
        },
      ];

      const extractionCompletion = await this.callAI(
        {
          model: agent?.model || 'gpt-4o-mini',
          messages: extractionMessages,
          response_format: { type: 'json_object' }, // Force JSON output
          ...parameters,
        },
        'Agent Rincian Pesanan',
        context.userId,
        context.messageId,
        'extract',
      );

      let extractedProducts: Array<{
        product_name: string;
        variant_name?: string;
        denomination: number;
        quantity: number;
      }> = [];

      try {
        const aiResponse = extractionCompletion.choices[0]?.message?.content || '';
        this.logger.debug(`AI raw response: ${aiResponse}`);

        // Parse JSON response
        const parsedResponse = JSON.parse(aiResponse);

        // Handle struktur { products: [...] } atau direct array
        if (parsedResponse.products && Array.isArray(parsedResponse.products)) {
          extractedProducts = parsedResponse.products;
        } else if (Array.isArray(parsedResponse)) {
          extractedProducts = parsedResponse;
        }

        // Normalisasi data - convert null ke undefined untuk variant_name
        extractedProducts = extractedProducts
          .map((p) => ({
            product_name: p.product_name || '',
            variant_name: p.variant_name || undefined,
            denomination: p.denomination || 0,
            quantity: p.quantity || 1,
          }))
          .filter((p) => p.product_name); // Filter yang tidak punya nama

        this.logger.log(`AI extracted products: ${JSON.stringify(extractedProducts)}`);
      } catch (parseError) {
        this.logger.warn(`Failed to parse AI extraction: ${(parseError as Error).message}`);
        // Fallback ke _products jika AI gagal
        extractedProducts = null;
      }

      if (extractedProducts.length === 0) {
        return {
          success: false,
          data: null,
          message:
            'Maaf, saya tidak bisa mengidentifikasi produk yang Anda maksud dari percakapan. Silakan sebutkan produk dengan lebih jelas.',
          skipLLM: true,
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

      // 2. Jika ada valid products, create cart dan kirim WA langsung
      if (validatedProducts.length > 0) {
        const cart = await this.cartService.createCart({
          user_id: context.userId,
          products: validatedProducts.map((p) => ({
            product_id: p.product_id!,
            product_name: p.actual_product_name!,
            variant_id: 0,
            variant_name: p.actual_variant_name || '',
            quantity: p.quantity,
            denomination: p.denomination,
            max_quantity: 100,
            price: p.price!,
            discount_price: 0,
            is_po: 0,
            automatic_po: 0,
            est_date_po: 0,
            stock_po: 0,
          })),
          wa_message_id: context.messageId,
        });

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
    }>,
  ): string {
    let message = '*Rincian Pesanan Anda:*\n\n';
    let totalPrice = 0;

    products.forEach((p, index) => {
      const subtotal = (p.price || 0) * p.quantity;
      totalPrice += subtotal;

      message += `*#${index + 1}*\n`;
      message += `Produk: ${p.actual_product_name}\n`;
      message += `Variant: ${p.actual_variant_name || '-'}\n`;
      message += `Berat: ${p.denomination} gram\n`;
      message += `Jumlah: ${p.quantity} keping\n`;
      message += `Harga per unit: Rp ${(p.price || 0).toLocaleString('id-ID')}\n`;
      message += `Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n\n`;
    });

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
          return {
            success: false,
            data: null,
            message: 'Tidak ada keranjang aktif. Silakan buat pesanan baru.',
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
          return {
            success: false,
            data: null,
            message: 'Keranjang kosong atau total tidak valid.',
          };
        }

        // 4. Hitung platform fee
        const feeCalculation = this.calculatePlatformFee(merchantAmount);
        const totalAmount = feeCalculation.totalWithFee;
        
        this.logger.log(
          `Platform fee calculation: type=${feeCalculation.feeType}, ` +
          `merchantAmount=${merchantAmount}, fee=${feeCalculation.platformFee}, ` +
          `total=${totalAmount}`
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
          // Tidak perlu tambah line item fee, Xendit yang handle
          this.logger.log(`Using Xendit Fee Rule: ${feeRuleId}`);
          
          invoice = await this.xenditService.createInvoiceWithFeeRule({
            externalId,
            amount: merchantAmount, // Amount asli tanpa fee (Xendit akan tambah fee)
            description: `Pembelian Emas - Order #${cart.id}`,
            payerEmail: 'customer@indogold.id',
            invoiceDuration: 86400,
            items: invoiceItems,
          }, feeRuleId);
        } else {
          // Fallback: Buat invoice manual dengan line item fee
          if (feeCalculation.platformFee > 0) {
            const feeItemName = feeCalculation.feeType === 'flat' 
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
          return {
            success: false,
            data: null,
            message: orderResult.message || 'Gagal membuat order.',
          };
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
            action: 'payment_link_created' 
          },
          message: paymentMessage,
          skipLLM: true, // Skip LLM, langsung kirim WA
        };
      } else {
        return {
          success: true,
          data: { action: 'cancel' },
          message:
            'Pesanan dibatalkan. Jika ingin memesan lagi, silakan informasikan produk yang diinginkan.',
        };
      }
    } catch (error) {
      this.logger.error(`User confirm buy error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: `Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * ==========================================================================
   * CALCULATE CART TOTAL
   * ==========================================================================
   */
  private calculateCartTotal(cart: Cart): number {
    // Parse json_order jika masih berupa string
    let orderItems: any[] = cart.json_order as any;
    
    if (typeof cart.json_order === 'string') {
      try {
        orderItems = JSON.parse(cart.json_order);
      } catch (e) {
        this.logger.error('Failed to parse json_order:', cart.json_order);
        return 0;
      }
    }
    
    if (!Array.isArray(orderItems)) {
      return 0;
    }

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
    // Parse json_order jika masih berupa string
    let orderItems: any[] = cart.json_order as any;
    
    if (typeof cart.json_order === 'string') {
      try {
        orderItems = JSON.parse(cart.json_order);
      } catch (e) {
        this.logger.error('Failed to parse json_order:', cart.json_order);
        return [];
      }
    }
    
    if (!Array.isArray(orderItems)) {
      return [];
    }

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
      flat: parseInt(process.env.PLATFORM_FEE_FLAT || '10000', 10)
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
      feeFlat: config.flat
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
  }): string {
    const formattedAmount = params.amount.toLocaleString('id-ID');
    const formattedExpiry = params.expiryDate.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Build breakdown biaya jika ada platform fee
    let breakdownText = '';
    if (params.merchantAmount && params.platformFee && params.platformFee > 0) {
      const formattedMerchantAmount = params.merchantAmount.toLocaleString('id-ID');
      const formattedPlatformFee = params.platformFee.toLocaleString('id-ID');
      
      if (params.feeType === 'flat') {
        breakdownText = `Subtotal Produk: Rp ${formattedMerchantAmount}\nBiaya Layanan: Rp ${formattedPlatformFee}\n`;
      } else {
        breakdownText = `Subtotal Produk: Rp ${formattedMerchantAmount}\nBiaya Layanan (${params.feePercent}%): Rp ${formattedPlatformFee}\n`;
      }
    }

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
      this.logger.log('Getting promo information');

      const promos = [
        {
          name: 'Cashback 2%',
          description: 'Cashback 2% untuk pembelian emas minimal 10 gram',
          code: 'CASHBACK2',
        },
        {
          name: 'Gratis Ongkir',
          description: 'Gratis ongkir untuk pengiriman ke seluruh Indonesia',
          code: 'FREEONGKIR',
        },
      ];

      return {
        success: true,
        data: promos,
        message: `Tersedia ${promos.length} promo aktif`,
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
   * GET BUYBACK INFORMATION
   * ==========================================================================
   */
  async getBuybackInformation(assistantAnswer: string): Promise<ToolResult> {
    try {
      this.logger.log('Getting buyback information');

      return {
        success: true,
        data: {
          info: 'Buyback hanya tersedia di Toko Langsung',
          contact: '+628118257699',
          link: 'https://indogold.id/buyback',
        },
        message: assistantAnswer,
      };
    } catch (error) {
      this.logger.error(`Get buyback info error: ${(error as Error).message}`);
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
  ): Promise<ToolResult> {
    try {
      this.logger.log(`Setting personalization: ${personality}`);

      await this.personalizationModel.upsert({
        user_id: context.userId,
        personality,
        updated_at: new Date(),
      });

      return {
        success: true,
        data: { personality },
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

  /**
   * ==========================================================================
   * VERIFY OTP
   * ==========================================================================
   * Verifikasi kode OTP pengambilan barang
   */
  async verifyOtp(orderId: number, otpCode: string): Promise<ToolResult> {
    try {
      this.logger.log(`Verifying OTP for order: ${orderId}`);

      const result = await this.orderService.verifyOtp(orderId, otpCode);

      return {
        success: result.success,
        data: null,
        message: result.message,
      };
    } catch (error) {
      this.logger.error(`Verify OTP error: ${(error as Error).message}`);
      return {
        success: false,
        data: null,
        message: 'Terjadi kesalahan saat verifikasi OTP.',
      };
    }
  }
}
