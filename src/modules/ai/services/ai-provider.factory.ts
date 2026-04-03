/**
 * ============================================================================
 * AI PROVIDER FACTORY
 * ============================================================================
 * 
 * Factory untuk membuat AI provider instance berdasarkan config.
 * Support multiple providers: OpenAI, Groq, Deepseek, dll.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAiProvider } from '../providers/base.provider';
import { OpenAiProvider } from '../providers/openai.provider';
import { GroqProvider } from '../providers/groq.provider';

export type AiProviderType = 'openai' | 'groq' | 'deepseek' | 'openrouter' | 'grok' | 'cerebras' | 'bailian';

@Injectable()
export class AiProviderFactory {
  private readonly logger = new Logger(AiProviderFactory.name);
  private readonly providers: Map<AiProviderType, BaseAiProvider> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeProviders();
  }

  /**
   * ==========================================================================
   * INITIALIZE PROVIDERS
   * ==========================================================================
   */
  private initializeProviders(): void {
    // OpenAI
    const openaiKey = this.configService.get<string>('ai.openai.apiKey');
    const openaiUrl = this.configService.get<string>('ai.openai.apiUrl');
    if (openaiKey) {
      this.providers.set('openai', new OpenAiProvider(openaiKey, openaiUrl));
      this.logger.log('✅ OpenAI provider initialized');
    }

    // Groq
    const groqKey = this.configService.get<string>('ai.groq.apiKey');
    const groqUrl = this.configService.get<string>('ai.groq.apiUrl');
    if (groqKey) {
      this.providers.set('groq', new GroqProvider(groqKey, groqUrl));
      this.logger.log('✅ Groq provider initialized');
    }

    // Deepseek
    const deepseekKey = this.configService.get<string>('ai.deepseek.apiKey');
    if (deepseekKey) {
      // Deepseek pakai OpenAI-compatible API
      const deepseekUrl = this.configService.get<string>('ai.deepseek.apiUrl');
      this.providers.set('deepseek', new OpenAiProvider(deepseekKey, deepseekUrl));
      this.logger.log('✅ Deepseek provider initialized');
    }

    // OpenRouter
    const openrouterKey = this.configService.get<string>('ai.openrouter.apiKey');
    if (openrouterKey) {
      const openrouterUrl = this.configService.get<string>('ai.openrouter.apiUrl');
      this.providers.set('openrouter', new OpenAiProvider(openrouterKey, openrouterUrl));
      this.logger.log('✅ OpenRouter provider initialized');
    }

    // Grok
    const grokKey = this.configService.get<string>('ai.grok.apiKey');
    if (grokKey) {
      const grokUrl = this.configService.get<string>('ai.grok.apiUrl');
      this.providers.set('grok', new OpenAiProvider(grokKey, grokUrl));
      this.logger.log('✅ Grok provider initialized');
    }

    // Cerebras
    const cerebrasKey = this.configService.get<string>('ai.cerebras.apiKey');
    if (cerebrasKey) {
      const cerebrasUrl = this.configService.get<string>('ai.cerebras.apiUrl');
      this.providers.set('cerebras', new OpenAiProvider(cerebrasKey, cerebrasUrl));
      this.logger.log('✅ Cerebras provider initialized');
    }

    // Bailian
    const bailianKey = this.configService.get<string>('ai.bailian.apiKey');
    if (bailianKey) {
      const bailianUrl = this.configService.get<string>('ai.bailian.apiUrl');
      this.providers.set('bailian', new OpenAiProvider(bailianKey, bailianUrl));
      this.logger.log('✅ Bailian provider initialized');
    }

    this.logger.log(`🚀 Total providers initialized: ${this.providers.size}`);
  }

  /**
   * ==========================================================================
   * GET PROVIDER
   * ==========================================================================
   * Get provider instance by type
   */
  getProvider(type: AiProviderType): BaseAiProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Provider '${type}' not found or not configured`);
    }
    return provider;
  }

  /**
   * ==========================================================================
   * GET DEFAULT PROVIDER
   * ==========================================================================
   * Get default provider (OpenAI)
   */
  getDefaultProvider(): BaseAiProvider {
    // Try OpenAI first, then any available provider
    if (this.providers.has('openai')) {
      return this.providers.get('openai')!;
    }
    
    const firstProvider = this.providers.values().next().value;
    if (firstProvider) {
      return firstProvider;
    }
    
    throw new Error('No AI provider configured');
  }

  /**
   * ==========================================================================
   * HAS PROVIDER
   * ==========================================================================
   * Check if provider is available
   */
  hasProvider(type: AiProviderType): boolean {
    return this.providers.has(type);
  }

  /**
   * ==========================================================================
   * GET AVAILABLE PROVIDERS
   * ==========================================================================
   * Get list of available provider types
   */
  getAvailableProviders(): AiProviderType[] {
    return Array.from(this.providers.keys());
  }
}
