/**
 * ============================================================================
 * MESSAGE PROCESSOR SERVICE
 * ============================================================================
 *
 * Service utama untuk memproses pesan WhatsApp.
 * - Menerima webhook dari Meta
 * - Validasi dan parsing pesan
 - Integrasi dengan AI untuk response
 * - Kirim balasan ke user
 *
 * Flow:
 * 1. Receive webhook → 2. Parse message → 3. Get/Create user
 * 4. Save message → 5. Buffering → 6. AI Processing
 * 7. Tool execution → 8. Send response
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Injectable, Logger } from '@nestjs/common';

import { WhatsappApiService } from '../../whatsapp/services/whatsapp-api.service';
import { AiOrchestratorService } from '../../ai/services/ai-orchestrator.service';
import { ToolRegistryService } from '../../ai/services/tool-registry.service';
import { ToolContext } from '../../ai/entities/tool.entity';
import { UserService, UserWithInfo } from '../../user/services/user.service';
import { MessageType, MessageRole } from '../../../database/models';
import { MediaService } from '../../media/services/media.service';
import { ChatService } from '../../chat/services/chat.service';
import { ChatMessage } from '../../ai/providers/base.provider';
import { WhatsAppMessage } from '../dto/meta-webhook.dto';

export interface ProcessMessageResult {
  success: boolean;
  response?: string;
  error?: string;
}

@Injectable()
export class MessageProcessorService {
  private readonly logger = new Logger(MessageProcessorService.name);
  private readonly processedMessageIds = new Set<string>();

  constructor(
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly aiOrchestrator: AiOrchestratorService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly whatsappApi: WhatsappApiService,
    private readonly mediaService: MediaService,
  ) {
    // Cleanup processed IDs setiap 5 menit
    setInterval(
      () => {
        this.processedMessageIds.clear();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * ==========================================================================
   * PROCESS MESSAGE
   * ==========================================================================
   * Main entry point untuk memproses pesan WhatsApp.
   */
  async processMessage(
    message: WhatsAppMessage,
    contact: { profile: { name: string }; wa_id: string },
  ): Promise<ProcessMessageResult> {
    try {
      // 1. Check duplicate
      if (this.processedMessageIds.has(message.id)) {
        this.logger.log(`Duplicate message skipped: ${message.id}`);
        return { success: true, response: 'duplicate' };
      }
      this.processedMessageIds.add(message.id);

      // 2. Extract message data
      const { wa_id: waId, profile } = contact;
      const messageType = message.type;

      // 3. Get or create user
      const user = await this.userService.findOrCreate(waId, profile.name);

      // 4. Check if user is blocked
      if (user.status === 'block') {
        return { success: false, error: 'User is blocked' };
      }

      // 5. Check spam
      const isSpam = await this.userService.checkSpam(user.id);
      if (isSpam) {
        await this.handleSpam(user, waId);
        return { success: false, error: 'Spam detected' };
      }

      // 6. Process berdasarkan message type
      let messageBody: string;

      switch (messageType) {
        case 'text':
          messageBody = message.text?.body || '';
          break;

        case 'image':
          if (message.image) {
            const media = await this.whatsappApi.downloadMedia(message.image.id);
            if (media) {
              await this.mediaService.saveFromBuffer(
                media.buffer,
                'image',
                media.fileName || 'image.jpg',
              );

              messageBody = `Pesan gambar: ${message.image.caption || ''}`;
            }
          }
          break;

        case 'audio':
          if (message.audio) {
            const media = await this.whatsappApi.downloadMedia(message.audio.id);
            if (media) {
              await this.mediaService.saveFromBuffer(
                media.buffer,
                'audio',
                media.fileName || 'audio.ogg',
              );

              messageBody = '[Pesan audio]';
            }
          }
          break;

        case 'interactive':
          if (message.interactive?.button_reply) {
            messageBody = message.interactive.button_reply.title;
          } else if (message.interactive?.list_reply) {
            messageBody = message.interactive.list_reply.title;
          } else {
            messageBody = '';
          }
          break;

        case 'order':
          messageBody = this.formatOrderMessage(message.order);
          break;

        case 'reaction':
          // Ignore reactions
          return { success: true };

        default:
          messageBody = `[${messageType} message]`;
      }

      // 7. Save user message
      await this.chatService.saveMessage({
        user_id: user.id,
        wa_message_id: message.id,
        reply_wa_message_id: message.context?.id,
        message: messageBody,
        type: this.mapMessageType(messageType),
        role: MessageRole.USER,
        json_data: message as unknown as Record<string, unknown>,
      });

      // 8. Check if bot should respond
      if (user.status === 'silent_bot') {
        return { success: true };
      }

      // 9. Send typing indicator (tanpa message_id untuk menghindari error reply)
      try {
        await this.whatsappApi.sendMessage({
          type: 'typing',
          to: waId,
          data: { message_id: message.id },
        });
      } catch (error) {
        this.logger.warn(`Failed to send typing indicator: ${(error as Error).message}`);
      }

      // 10. Buffer message dan process
      const combinedMessage = await this.chatService.bufferMessage(waId, messageBody, profile.name);

      // 11. Build messages untuk AI
      // 11. Build messages untuk AI
      const messages: ChatMessage[] = [{ role: 'user', content: combinedMessage }];

      // 13. Process dengan AI
      const aiResponse = await this.aiOrchestrator.processMessage('AI Utama', messages, {
        userPhone: waId,
        userId: user.id,
        userName: profile.name,
        waMessageId: message.id,
        replyMessageId: message.context?.id,
      });

      // 14. Handle tool calls jika ada
      let finalResponse = aiResponse.content;
      let waAlreadySent = false; // Flag untuk menandai WA sudah dikirim oleh tool

      this.logger.log(
        `AI Response content: ${finalResponse || '(null)'}, toolCalls: ${aiResponse.toolCalls?.length || 0}`,
      );

      // Jika content kosong/null dan ada tool calls, proses tool calls
      if (
        (!finalResponse || finalResponse.trim() === '' || finalResponse === 'null') &&
        aiResponse.toolCalls &&
        aiResponse.toolCalls.length > 0
      ) {
        this.logger.log(`Processing ${aiResponse.toolCalls.length} tool calls...`);

        // Execute tools dan get results
        const toolResults = await this.executeTools(aiResponse.toolCalls, {
          userPhone: waId,
          userName: profile.name,
          userId: user.id,
          messageId: message.id,
          replyMessageId: message.context?.id,
          conversationHistory: messages.map((m) => ({
            role: m.role as string,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          })),
        });

        this.logger.log(
          `Tool results: ${JSON.stringify(toolResults.map((r) => ({ role: r.role, content_length: r.content?.length, skipLLM: r.skipLLM })))}`,
        );

        // Cek apakah ada tool yang require skip LLM (langsung kirim WA)
        const skipLLMTool = toolResults.find((r) => r.skipLLM);
        if (skipLLMTool) {
          // Tool sudah kirim WA langsung, tidak perlu kirim lagi
          waAlreadySent = true;
          finalResponse = skipLLMTool.content;
          this.logger.log(`Tool handled directly and sent WA, skipping LLM and WA send: ${finalResponse}`);
        } else {
          // Get natural response dengan tool results
          const naturalResponse = await this.aiOrchestrator.getNaturalResponse(
            messages,
            toolResults,
            aiResponse.assistantMessage || null,
            {
              userPhone: waId,
              userId: user.id,
              userName: profile.name,
              waMessageId: message.id,
            },
          );

          finalResponse = naturalResponse.content;
          this.logger.log(`Natural response: ${finalResponse || '(null)'}`);
        }
      }

      // Fallback jika finalResponse masih kosong
      if (!finalResponse || finalResponse.trim() === '') {
        finalResponse =
          'Maaf, saya tidak dapat memproses permintaan Anda saat ini. Silakan coba lagi.';
        this.logger.warn(`Empty response, using fallback message`);
      }

      // 15. Send response ke WhatsApp (hanya jika belum dikirim oleh tool)
      let sentMessage;
      if (!waAlreadySent) {
        try {
          sentMessage = await this.whatsappApi.sendMessage({
            type: 'text',
            to: waId,
            data: { text: finalResponse },
          });
        } catch (error) {
          this.logger.error(`Failed to send message: ${(error as Error).message}`);
          return { success: false, error: (error as Error).message };
        }
      } else {
        this.logger.log('WA already sent by tool, skipping sendMessage');
        // Buat dummy sentMessage untuk keperluan saveMessage
        sentMessage = { messages: [{ id: 'tool-sent' }] };
      }

      // 16. Save AI response
      await this.chatService.saveMessage({
        user_id: user.id,
        wa_message_id: sentMessage.messages[0]?.id,
        message: finalResponse,
        type: MessageType.TEXT,
        role: MessageRole.ASSISTANT,
      });

      return { success: true, response: finalResponse };
    } catch (error) {
      this.logger.error(`Message processing error: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * ==========================================================================
   * EXECUTE TOOLS
   * ==========================================================================
   * Execute tools dan return hasil untuk dikirim ke AI
   */
  private async executeTools(
    toolCalls: Array<{ id?: string; name: string; arguments: Record<string, unknown> }>,
    context: ToolContext,
  ): Promise<Array<{ role: string; content: string; tool_call_id?: string; tool_name?: string; skipLLM?: boolean }>> {
    const results: Array<{
      role: string;
      content: string;
      tool_call_id?: string;
      tool_name?: string;
      skipLLM?: boolean;
    }> = [];

    for (const toolCall of toolCalls) {
      const result = await this.toolRegistry.executeTool(
        toolCall.name,
        toolCall.arguments,
        context,
      );

      // Sertakan message (hasil tool execution) untuk digunakan Agent Response
      // Atau fallback ke data jika message kosong
      const content = result.message || JSON.stringify(result.data);

      results.push({
        role: 'tool',
        content: content,
        tool_call_id: toolCall.id,
        tool_name: toolCall.name,
        skipLLM: result.skipLLM, // Pass skipLLM flag
      });
    }

    return results;
  }

  /**
   * ==========================================================================
   * UPDATE MESSAGE STATUS
   * ==========================================================================
   */
  async updateMessageStatus(
    messageId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed',
  ): Promise<void> {
    const statusMap = {
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
    };

    await this.chatService.updateMessageStatus(messageId, statusMap[status] as any);
  }

  /**
   * ==========================================================================
   * HANDLE SPAM
   * ==========================================================================
   */
  private async handleSpam(user: UserWithInfo, waId: string): Promise<void> {
    await this.userService.blockUser(user.id);

    const response = {
      action: 'result',
      msg: {
        body: 'Sistem kami mendeteksi aktivitas berlebihan yang menyerupai spam. Untuk menjaga kualitas layanan, kami akan menghentikan respons sementara.',
        url: null,
      },
      type: 'text',
    };

    await this.whatsappApi.sendMessage({
      type: 'text',
      to: waId,
      data: { text: response.msg.body },
    });

    // User blocked - no need to block via API
  }

  /**
   * ==========================================================================
   * MAP MESSAGE TYPE
   * ==========================================================================
   */
  private mapMessageType(type: string): MessageType {
    const typeMap: Record<string, MessageType> = {
      text: MessageType.TEXT,
      image: MessageType.IMAGE,
      audio: MessageType.AUDIO,
      video: MessageType.VIDEO,
      document: MessageType.DOCUMENT,
      sticker: MessageType.STICKER,
      interactive: MessageType.INTERACTIVE,
      order: MessageType.ORDER,
    };

    return typeMap[type] || MessageType.TEXT;
  }

  /**
   * ==========================================================================
   * FORMAT ORDER MESSAGE
   * ==========================================================================
   */
  private formatOrderMessage(order: WhatsAppMessage['order']): string {
    if (!order) return '';

    let message = 'Saya pesan:\n';
    order.product_items.forEach((item) => {
      message += `- ${item.product_retailer_id}: ${item.quantity} keping\n`;
    });

    return message;
  }
}
