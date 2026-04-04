/**
 * ============================================================================
 * CHAT SERVICE
 * ============================================================================
 * 
 * Service untuk chat history dan conversation management.
 * 
 * Fitur:
 * - Save conversation messages
 * - Get conversation history (untuk LLM context)
 * - Update message status (sent, delivered, read, failed)
 * - Message buffering untuk batch processing
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ChatHistory, MessageType, MessageRole, MessageStatus } from '../../../database/models';
import { SaveMessageDto } from '../dto/save-message.dto';

/**
 * Message buffer entry
 */
interface BufferEntry {
  userId: string;
  messages: string[];
  timer: NodeJS.Timeout | null;
  name: string;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

/**
 * Conversation context untuk LLM
 */
export interface ConversationContext {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class ChatService {
  private readonly messageBuffer = new Map<string, BufferEntry>();
  private readonly MESSAGE_IDLE_TIMEOUT = 5000; // 5 detik

  constructor(
    @InjectModel(ChatHistory)
    private readonly chatHistoryModel: typeof ChatHistory,
  ) {}

  /**
   * ==========================================================================
   * SAVE MESSAGE
   * ==========================================================================
   * Simpan pesan ke chat history.
   */
  async saveMessage(dto: SaveMessageDto): Promise<ChatHistory> {
    const chat = await this.chatHistoryModel.create({
      user_id: dto.user_id,
      wa_message_id: dto.wa_message_id || null,
      reply_wa_message_id: dto.reply_wa_message_id || null,
      message: dto.message,
      processed_content: dto.processed_content || null,
      type: dto.type || MessageType.TEXT,
      role: dto.role,
      json_data: dto.json_data || null,
      is_llm_read: dto.is_llm_read ?? 1,
    });

    return chat;
  }

  /**
   * ==========================================================================
   * GET CONVERSATION HISTORY
   * ==========================================================================
   * Ambil conversation history untuk LLM context.
   * Default: 5 pesan terakhir.
   */
  async getConversationHistory(
    userId: number,
    limit: number = 5,
  ): Promise<ConversationContext[]> {
    const history = await this.chatHistoryModel.findAll({
      where: {
        user_id: userId,
        is_llm_read: 1,
      },
      order: [['id', 'DESC']],
      limit,
    });

    // Reverse untuk chronological order
    return history
      .reverse()
      .map((chat) => ({
        role: chat.role as 'user' | 'assistant',
        // Gunakan processed_content untuk LLM context jika tersedia,
        // fallback ke message untuk tampilan UI biasa
        content: chat.processed_content || chat.message,
      }));
  }

  /**
   * ==========================================================================
   * UPDATE MESSAGE STATUS
   * ==========================================================================
   * Update status pesan (sent, delivered, read, failed).
   */
  async updateMessageStatus(
    waMessageId: string,
    status: MessageStatus,
  ): Promise<void> {
    await this.chatHistoryModel.update(
      { status },
      {
        where: {
          wa_message_id: waMessageId,
          status: { [Op.ne]: MessageStatus.FAILED },
        },
      },
    );
  }

  /**
   * ==========================================================================
   * UPDATE JSON DATA
   * ==========================================================================
   * Update json_data field (untuk menyimpan payload dari webhook).
   */
  async updateJsonData(
    waMessageId: string,
    jsonData: Record<string, unknown>,
  ): Promise<void> {
    await this.chatHistoryModel.update(
      { json_data: jsonData },
      { where: { wa_message_id: waMessageId } },
    );
  }

  /**
   * ==========================================================================
   * MARK AS LLM READ
   * ==========================================================================
   * Tandai pesan sudah dibaca oleh LLM.
   */
  async markAsLlmRead(waMessageId: string): Promise<void> {
    await this.chatHistoryModel.update(
      { is_llm_read: 1 },
      { where: { wa_message_id: waMessageId } },
    );
  }

  /**
   * ==========================================================================
   * BUFFER MESSAGE
   * ==========================================================================
   * Buffer message untuk batch processing.
   * Returns: Promise yang resolve dengan combined message.
   */
  async bufferMessage(
    userId: string,
    message: string,
    name: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let entry = this.messageBuffer.get(userId);

      if (!entry) {
        entry = {
          userId,
          messages: [],
          timer: null,
          name,
          resolve,
          reject,
        };
        this.messageBuffer.set(userId, entry);
      }

      // Add message to buffer
      entry.messages.push(message);

      // Clear existing timer
      if (entry.timer) {
        clearTimeout(entry.timer);
      }

      // Set new timer
      entry.timer = setTimeout(() => {
        const combinedMessage = entry!.messages.join('\n');
        this.messageBuffer.delete(userId);
        resolve(combinedMessage);
      }, this.MESSAGE_IDLE_TIMEOUT);
    });
  }

  /**
   * ==========================================================================
   * CLEAR BUFFER
   * ==========================================================================
   * Clear message buffer untuk user tertentu.
   */
  clearBuffer(userId: string): void {
    const entry = this.messageBuffer.get(userId);
    if (entry?.timer) {
      clearTimeout(entry.timer);
    }
    this.messageBuffer.delete(userId);
  }

  /**
   * ==========================================================================
   * GET MESSAGE BY WA ID
   * ==========================================================================
   * Cari pesan berdasarkan WA message ID.
   */
  async getMessageByWaId(waMessageId: string): Promise<ChatHistory | null> {
    return this.chatHistoryModel.findOne({
      where: { wa_message_id: waMessageId },
    });
  }

  /**
   * ==========================================================================
   * GET LAST USER MESSAGE
   * ==========================================================================
   * Ambil pesan terakhir dari user.
   */
  async getLastUserMessage(userId: number): Promise<ChatHistory | null> {
    return this.chatHistoryModel.findOne({
      where: {
        user_id: userId,
        role: MessageRole.USER,
      },
      order: [['timestamp', 'DESC']],
    });
  }

  /**
   * ==========================================================================
   * FIND CART BY WA MESSAGE ID
   * ==========================================================================
   * Cari cart berdasarkan wa_message_id (untuk handle tombol reply).
   */
  async findByWaMessageId(waMessageId: string): Promise<any | null> {
    // Import Cart model dynamically to avoid circular dependency
    const { Cart } = await import('../../../database/models');
    return Cart.findOne({
      where: { wa_message_id: waMessageId },
    });
  }
}
