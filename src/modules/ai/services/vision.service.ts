/**
 * ============================================================================
 * VISION SERVICE
 * ============================================================================
 *
 * Service untuk analisis gambar menggunakan LLM Vision.
 * - Mendeteksi KTP dan melakukan OCR
 * - Memberikan deskripsi gambar non-KTP
 * - Support hybrid model configuration
 * - Cost tracking untuk vision requests
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { StudioAI, AgentAI, ModelAI, CostOperationType } from '../../../database/models';
import { AiProviderFactory, AiProviderType } from './ai-provider.factory';
import { CostTrackingService } from './cost-tracking.service';
import { ChatMessage } from '../providers/base.provider';

export interface VisionResult {
  is_ktp: boolean;
  ktp_data: {
    nik?: string | null;
    nama?: string | null;
    tempat_lahir?: string | null;
    tanggal_lahir?: string | null;
    jenis_kelamin?: string | null;
    alamat?: string | null;
    rt?: string | null;
    rw?: string | null;
    kelurahan?: string | null;
    kecamatan?: string | null;
    kabupaten?: string | null;
    provinsi?: string | null;
    agama?: string | null;
    status_perkawinan?: string | null;
    pekerjaan?: string | null;
    kewarganegaraan?: string | null;
    berlaku_hingga?: string | null;
  } | null;
  description: string;
}

interface ResolvedModelConfig {
  modelName: string;
  providerType: AiProviderType;
  studioName: string;
  modelId: number;
  agentId: number | null;
  provider: ReturnType<AiProviderFactory['getProvider']>;
}

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);

  constructor(
    @InjectModel(AgentAI)
    private readonly agentModel: typeof AgentAI,
    @InjectModel(ModelAI)
    private readonly modelAiModel: typeof ModelAI,
    private readonly providerFactory: AiProviderFactory,
    private readonly costTracking: CostTrackingService,
  ) {}

  /**
   * ==========================================================================
   * ANALYZE IMAGE
   * ==========================================================================
   * Analisis gambar menggunakan LLM Vision.
   * Return hasil deteksi KTP atau deskripsi gambar.
   */
  async analyzeImage(
    imageBuffer: Buffer,
    waMessageId: string,
    userId: number,
  ): Promise<VisionResult> {
    const startTime = Date.now();

    try {
      const visionConfig = await this.resolveModelConfig();

      // Encode image ke base64 data URL
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.detectMimeType(imageBuffer);
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt();

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ];

      const completion = await visionConfig.provider.createCompletion({
        model: visionConfig.modelName,
        messages,
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        store: false,
      });

      // Track cost
      await this.costTracking.trackCost(
        completion,
        visionConfig.agentId,
        userId,
        waMessageId,
        messages,
        Date.now() - startTime,
        visionConfig.modelId,
        CostOperationType.VISION_ANALYSIS,
      );

      const rawContent = completion.choices[0]?.message?.content || '{}';
      const parsed = this.parseVisionResponse(rawContent);

      this.logger.log(
        `Vision analysis: is_ktp=${parsed.is_ktp}, description="${parsed.description.substring(0, 80)}..."`,
      );

      return parsed;
    } catch (error) {
      this.logger.error(`Vision analysis error: ${(error as Error).message}`);
      return {
        is_ktp: false,
        ktp_data: null,
        description: 'Gambar tidak dapat dianalisis.',
      };
    }
  }

  /**
   * ==========================================================================
   * RESOLVE MODEL CONFIG
   * ==========================================================================
   * Resolve provider & model untuk vision analysis.
   * Priority: hybrid_model_id dari agent "AI Utama" → fallback model_id.
   */
  private async resolveModelConfig(): Promise<ResolvedModelConfig> {
    // Get AI Utama dari studio aktif dengan ModelAI included
    const mainAgent = await this.agentModel.findOne({
      where: { name: 'AI Utama' },
      include: [
        {
          model: StudioAI,
          where: { is_used: '1' },
          required: true,
        },
        { model: ModelAI, as: 'mainModel' },
        { model: ModelAI, as: 'hybridModel' },
      ],
    });

    // 1. Coba hybrid model dulu (harus support vision)
    if (mainAgent?.hybrid_model_id) {
      const hybridModel = await this.modelAiModel.findOne({
        where: { id: mainAgent.hybrid_model_id },
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
        const provider = this.providerFactory.getProvider(providerType);

        if (provider.supportsVision()) {
          this.logger.log(
            `Vision using hybrid model: ${hybridModel.model} from ${hybridModel.studio.studio}`,
          );
          return {
            modelName: hybridModel.model,
            providerType,
            studioName: hybridModel.studio.studio,
            modelId: hybridModel.id,
            agentId: null,
            provider,
          };
        } else {
          this.logger.warn(
            `Hybrid model ${hybridModel.model} from ${hybridModel.studio.studio} does not support vision, skipping hybrid`,
          );
        }
      }
    }

    // 2. Fallback ke main model dengan studio utama (is_used='1') (harus support vision)
    if (mainAgent?.model_id) {
      const mainModel = await this.modelAiModel.findOne({
        where: { id: mainAgent.model_id },
        include: [
          {
            model: StudioAI,
            where: { is_used: '1' },
            required: true,
          },
        ],
      });

      if (mainModel?.studio) {
        const providerType = this.mapStudioToProvider(mainModel.studio.studio);
        const provider = this.providerFactory.getProvider(providerType);

        if (provider.supportsVision()) {
          this.logger.log(
            `Vision using main model: ${mainModel.model} from ${mainModel.studio.studio}`,
          );
          return {
            modelName: mainModel.model,
            providerType,
            studioName: mainModel.studio.studio,
            modelId: mainModel.id,
            agentId: mainAgent.id,
            provider,
          };
        } else {
          this.logger.warn(
            `Main model ${mainModel.model} from ${mainModel.studio.studio} does not support vision, falling back to OpenAI`,
          );
        }
      }
    }

    // 3. Ultimate fallback ke OpenAI gpt-4o-mini
    this.logger.log('Vision fallback to OpenAI gpt-4o-mini');
    return {
      modelName: 'gpt-4o-mini',
      providerType: 'openai',
      studioName: 'OpenAI',
      modelId: 0,
      agentId: mainAgent?.id || null,
      provider: this.providerFactory.getProvider('openai'),
    };
  }

  /**
   * ==========================================================================
   * BUILD SYSTEM PROMPT
   * ==========================================================================
   */
  private buildSystemPrompt(): string {
    return `
Anda adalah asisten vision AI yang bertugas menganalisis gambar yang dikirim oleh user melalui WhatsApp.

Tugas Anda:
1. Deteksi apakah gambar tersebut adalah KTP (Kartu Tanda Penduduk) Indonesia.
2. Jika gambar adalah KTP, lakukan OCR dan ekstrak data seakurat mungkin.
3. Jika gambar BUKAN KTP, berikan deskripsi singkat dan jelas tentang isi gambar dalam Bahasa Indonesia.

WAJIB kembalikan response dalam format JSON murni (tanpa markdown code block) dengan struktur berikut:

{
  "is_ktp": true | false,
  "ktp_data": {
    "nik": "string | null",
    "nama": "string | null",
    "tempat_lahir": "string | null",
    "tanggal_lahir": "string | null",
    "jenis_kelamin": "string | null",
    "alamat": "string | null",
    "rt": "string | null",
    "rw": "string | null",
    "kelurahan": "string | null",
    "kecamatan": "string | null",
    "kabupaten": "string | null",
    "provinsi": "string | null",
    "agama": "string | null",
    "status_perkawinan": "string | null",
    "pekerjaan": "string | null",
    "kewarganegaraan": "string | null",
    "berlaku_hingga": "string | null"
  },
  "description": "string"
}

Aturan pengisian:
- Jika gambar adalah KTP: isi ktp_data dengan nilai yang terbaca. Jika ada field yang blur/tidak terbaca, isi null. description berisi ringkasan singkat.
- Jika gambar BUKAN KTP: ktp_data harus null, description berisi deskripsi gambar.
- Pastikan semua text field menggunakan huruf kapital sesuai aslinya (jangan ubah case).
- Jangan tambahkan penjelasan di luar JSON.
`.trim();
  }

  /**
   * ==========================================================================
   * BUILD USER PROMPT
   * ==========================================================================
   */
  private buildUserPrompt(): string {
    return 'Analisis gambar ini dan kembalikan hasilnya dalam format JSON sesuai instruksi.';
  }

  /**
   * ==========================================================================
   * PARSE VISION RESPONSE
   * ==========================================================================
   */
  private parseVisionResponse(content: string): VisionResult {
    try {
      const cleaned = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

      const parsed = JSON.parse(cleaned) as VisionResult;

      return {
        is_ktp: parsed.is_ktp === true,
        ktp_data: parsed.is_ktp === true ? parsed.ktp_data || {} : null,
        description: parsed.description || '',
      };
    } catch (error) {
      this.logger.warn(`Failed to parse vision response: ${content}`);
      return {
        is_ktp: false,
        ktp_data: null,
        description: 'Gambar tidak dapat dianalisis.',
      };
    }
  }

  /**
   * ==========================================================================
   * DETECT MIME TYPE
   * ==========================================================================
   */
  private detectMimeType(buffer: Buffer): string {
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      return 'image/jpeg';
    }
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46
    ) {
      return 'image/gif';
    }
    if (
      buffer.length >= 12 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp';
    }
    return 'image/jpeg';
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
