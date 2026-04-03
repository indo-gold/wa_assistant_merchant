/**
 * ============================================================================
 * GROQ PROVIDER
 * ============================================================================
 * 
 * Implementation dari BaseAiProvider untuk Groq API.
 * Groq menawarkan inference yang sangat cepat.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { BaseAiProvider, CompletionRequest, CompletionResponse } from './base.provider';

@Injectable()
export class GroqProvider extends BaseAiProvider {
  private readonly logger = new Logger(GroqProvider.name);

  constructor(apiKey: string, apiUrl: string = 'https://api.groq.com/openai/v1') {
    super('Groq', apiUrl, apiKey);
  }

  async createCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages as any,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        response_format: request.response_format as any,
        tools: request.tools as any,
        tool_choice: request.tool_choice as any,
      });

      return this.mapResponse(response);
    } catch (error) {
      this.logger.error(`Groq completion error: ${(error as Error).message}`);
      throw error;
    }
  }

  async createTranscription(audioFile: Buffer, model: string = 'whisper-large-v3'): Promise<string> {
    try {
      // Convert Buffer to Blob untuk kompatibilitas
      const blob = new Blob([audioFile as unknown as BlobPart], { type: 'audio/ogg' });
      const file = new File([blob], 'audio.ogg', { type: 'audio/ogg' });
      
      const response = await this.client.audio.transcriptions.create({
        file,
        model,
      });

      return response.text;
    } catch (error) {
      this.logger.error(`Groq transcription error: ${(error as Error).message}`);
      throw error;
    }
  }

  supportsVision(): boolean {
    return true; // Groq support vision untuk beberapa model
  }

  supportsFunctionCalling(): boolean {
    return true;
  }

  private mapResponse(response: any): CompletionResponse {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      choices: response.choices.map((choice: any) => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content,
          tool_calls: choice.message.tool_calls?.map((tc: any) => ({
            id: tc.id,
            type: tc.type,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        },
        finish_reason: choice.finish_reason,
      })),
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
        input_tokens: response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens,
      },
    };
  }
}
