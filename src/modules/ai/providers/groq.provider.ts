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
      const body: any = {
        model: request.model,
        messages: request.messages as any,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      };

      if (request.response_format) {
        body.response_format = request.response_format;
      }

      // Detect if conversation history contains tool_calls or tool messages
      const hasToolContext = request.messages.some(
        (m: any) => m.role === 'tool' || m.tool_calls?.length > 0,
      );

      if (request.tools && request.tools.length > 0) {
        body.tools = request.tools;
      }

      // Groq API defaults tool_choice to 'none' in some cases, which causes
      // 400 errors when the model tries to call a tool. We must explicitly
      // set tool_choice when tools are present in the request.
      //
      // Note: we only set tool_choice here when tools are actually provided.
      // When there is only tool context (e.g. natural response after tool
      // execution) without tools, we leave tool_choice unset to avoid forcing
      // the model to call non-existent tools.
      if (request.tools?.length > 0) {
        if (request.tool_choice && request.tool_choice !== 'none') {
          body.tool_choice = request.tool_choice;
        } else {
          body.tool_choice = 'auto';
        }
      } else if (hasToolContext && request.tool_choice && request.tool_choice !== 'none') {
        // Conversation has tool context but no tools are being offered now.
        // Don't force 'required' because there's nothing to call.
        body.tool_choice = request.tool_choice === 'required' ? 'auto' : request.tool_choice;
      }

      try {
        const response = await this.client.chat.completions.create(body);
        return this.mapResponse(response);
      } catch (error: any) {
        const msg = error?.message || '';
        // Some Groq-hosted models may advertise support for tool_choice: required
        // but occasionally fail to emit a tool call. In that case we retry once
        // with 'auto' so the conversation can continue gracefully.
        if (body.tool_choice === 'required' && msg.includes('Tool choice is required, but model did not call a tool')) {
          this.logger.warn('Groq model failed to call tool with tool_choice: required. Retrying with auto.');
          body.tool_choice = 'auto';
          const response = await this.client.chat.completions.create(body);
          return this.mapResponse(response);
        }
        throw error;
      }
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
