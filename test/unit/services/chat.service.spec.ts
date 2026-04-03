/**
 * ============================================================================
 * CHAT SERVICE UNIT TESTS
 * ============================================================================
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ChatService } from '../../../src/modules/chat/services/chat.service';
import { ChatHistory, MessageRole, MessageType } from '../../../src/database/models';
import { mockChatHistoryModel, sampleChatHistory } from '../../mocks/database.mock';

describe('ChatService', () => {
  let service: ChatService;
  let chatHistoryModel: ReturnType<typeof mockChatHistoryModel>;

  beforeEach(async () => {
    chatHistoryModel = mockChatHistoryModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getModelToken(ChatHistory),
          useValue: chatHistoryModel,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveMessage', () => {
    it('should save message successfully', async () => {
      // Arrange
      const saveMessageDto = {
        user_id: 1,
        wa_message_id: 'wamid.123456',
        message: 'Hello World',
        role: MessageRole.USER,
        type: MessageType.TEXT,
      };
      chatHistoryModel.create.mockResolvedValue(sampleChatHistory);

      // Act
      const result = await service.saveMessage(saveMessageDto);

      // Assert
      expect(chatHistoryModel.create).toHaveBeenCalledWith(saveMessageDto);
      expect(result).toBeDefined();
    });
  });

  describe('getConversationHistory', () => {
    it('should return conversation history', async () => {
      // Arrange
      const mockHistory = [
        { ...sampleChatHistory, role: 'user', message: 'Hello' },
        { ...sampleChatHistory, id: 2, role: 'assistant', message: 'Hi there' },
      ];
      chatHistoryModel.findAll.mockResolvedValue(mockHistory);

      // Act
      const result = await service.getConversationHistory(1, 5);

      // Assert
      expect(chatHistoryModel.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        order: [['timestamp', 'DESC']],
        limit: 5,
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no history', async () => {
      // Arrange
      chatHistoryModel.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getConversationHistory(1, 5);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateMessageStatus', () => {
    it('should update message status', async () => {
      // Arrange
      chatHistoryModel.update.mockResolvedValue([1]);

      // Act
      await service.updateMessageStatus('wamid.123456', 'delivered');

      // Assert
      expect(chatHistoryModel.update).toHaveBeenCalledWith(
        { status: 'delivered' },
        { where: { wa_message_id: 'wamid.123456' } },
      );
    });
  });

  describe('bufferMessage', () => {
    it('should buffer and combine messages within timeout', async () => {
      // Arrange
      const phoneNumber = '6281234567890';
      const message1 = 'Hello';
      const message2 = 'World';
      const contactName = 'John';

      // Act - First message
      const promise1 = service.bufferMessage(phoneNumber, message1, contactName);
      
      // Act - Second message (should be combined)
      const promise2 = service.bufferMessage(phoneNumber, message2, contactName);

      // Wait for promises
      const result = await Promise.race([promise1, promise2]);

      // Assert
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });
  });
});
