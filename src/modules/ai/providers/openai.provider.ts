/**
 * ============================================================================
 * OPENAI PROVIDER
 * ============================================================================
 * 
 * Implementation dari BaseAiProvider untuk OpenAI API.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { BaseAiProvider, CompletionRequest, CompletionResponse } from './base.provider';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OpenAiProvider extends BaseAiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(apiKey: string, apiUrl: string = 'https://api.openai.com/v1') {
    super('OpenAI', apiUrl, apiKey);
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
        store: request.store ?? false,
      });

      return this.mapResponse(response);
    } catch (error) {
      this.logger.error(`OpenAI completion error: ${(error as Error).message}`);
      throw error;
    }
  }

  async createTranscription(audioFile: Buffer, model: string = 'whisper-1'): Promise<string> {
    try {
      // Write buffer to temp file
      const tempPath = path.join(process.cwd(), 'temp', `audio-${Date.now()}.ogg`);
      
      // Ensure temp directory exists
      if (!fs.existsSync(path.dirname(tempPath))) {
        fs.mkdirSync(path.dirname(tempPath), { recursive: true });
      }
      
      fs.writeFileSync(tempPath, audioFile);

      const response = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempPath),
        model,
      });

      // Cleanup temp file
      fs.unlinkSync(tempPath);

      return response.text;
    } catch (error) {
      this.logger.error(`OpenAI transcription error: ${(error as Error).message}`);
      throw error;
    }
  }

  supportsVision(): boolean {
    return true;
  }

  supportsFunctionCalling(): boolean {
    return true;
  }

  /**
   * Map OpenAI response ke standard format
   */
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
        prompt_tokens_details: response.usage?.prompt_tokens_details,
        input_tokens_details: response.usage?.input_tokens_details,
      },
    };
  }
}
