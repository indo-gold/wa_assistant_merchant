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
  private readonly baseURL: string;

  constructor(apiKey: string, apiUrl: string = 'https://api.openai.com/v1') {
    super('OpenAI', apiUrl, apiKey, 60000); // 60s timeout for OpenAI
    this.baseURL = apiUrl;
  }

  async createCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Build request body dynamically based on provider capabilities
        const body: any = {
          model: request.model,
          messages: request.messages as any,
          temperature: request.temperature,
          max_tokens: request.max_tokens,
        };

        const isCerebras = this.baseURL?.includes('cerebras');
        const isOpenAI = this.baseURL?.includes('openai.com');

        // Only send store for official OpenAI
        if (isOpenAI && request.store !== undefined) {
          body.store = request.store;
        }

        // response_format not supported by Cerebras
        if (!isCerebras && request.response_format) {
          body.response_format = request.response_format;
        }

        // parallel_tool_calls not supported by Cerebras
        if (!isCerebras && request.parallel_tool_calls !== undefined) {
          body.parallel_tool_calls = request.parallel_tool_calls;
        }

        if (request.tools) {
          body.tools = request.tools;
        }

        // tool_choice 'required' not supported by Cerebras
        if (request.tool_choice) {
          if (isCerebras && request.tool_choice === 'required') {
            this.logger.warn('Skipping tool_choice: required for Cerebras');
          } else {
            body.tool_choice = request.tool_choice;
          }
        }

        const response = await this.client.chat.completions.create(body);

        return this.mapResponse(response);
      } catch (error) {
        lastError = error as Error;
        const errMsg = lastError.message || '';

        // Log detailed error on first failure
        if (attempt === 1) {
          this.logger.error(
            `OpenAI completion error (attempt ${attempt}/${maxRetries}): ${errMsg} | BaseURL: ${this.baseURL}`,
          );
        } else {
          this.logger.warn(
            `OpenAI completion retry ${attempt}/${maxRetries}: ${errMsg}`,
          );
        }

        // Retry only on connection/timeout errors, not on 4xx client errors
        const isRetryable =
          errMsg.includes('Connection error') ||
          errMsg.includes('ETIMEDOUT') ||
          errMsg.includes('ECONNRESET') ||
          errMsg.includes('timeout') ||
          errMsg.includes('fetch failed');

        if (!isRetryable || attempt === maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s
        const delay = attempt * 1000;
        this.logger.log(`Retrying OpenAI completion in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
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
    // Cerebras does not support vision as of now
    return !this.baseURL?.includes('cerebras');
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
