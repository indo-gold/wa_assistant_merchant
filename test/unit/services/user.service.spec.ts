/**
 * ============================================================================
 * USER SERVICE UNIT TESTS
 * ============================================================================
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { UserService } from '../../../src/modules/user/services/user.service';
import { User, UserStatus, ChatHistory } from '../../../src/database/models';
import { mockUserModel, mockChatHistoryModel, sampleUser } from '../../mocks/database.mock';

describe('UserService', () => {
  let service: UserService;
  let userModel: ReturnType<typeof mockUserModel>;
  let chatHistoryModel: ReturnType<typeof mockChatHistoryModel>;

  beforeEach(async () => {
    userModel = mockUserModel();
    chatHistoryModel = mockChatHistoryModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User),
          useValue: userModel,
        },
        {
          provide: getModelToken(ChatHistory),
          useValue: chatHistoryModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreate', () => {
    it('should return existing user with isNew=false', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(sampleUser);
      chatHistoryModel.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findOrCreate('6281234567890', 'John Doe');

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { phone_number: '6281234567890' },
      });
      expect(result.isNew).toBe(false);
      expect(result.phone_number).toBe('6281234567890');
    });

    it('should create new user with isNew=true', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue(sampleUser);

      // Act
      const result = await service.findOrCreate('6281234567890', 'John Doe');

      // Assert
      expect(userModel.create).toHaveBeenCalledWith({
        name: 'John Doe',
        phone_number: '6281234567890',
        status: UserStatus.ACTIVE,
      });
      expect(result.isNew).toBe(true);
    });

    it('should update name if changed', async () => {
      // Arrange
      const existingUser = {
        ...sampleUser,
        name: 'Old Name',
        update: jest.fn().mockResolvedValue(undefined),
      };
      userModel.findOne.mockResolvedValue(existingUser);
      chatHistoryModel.findOne.mockResolvedValue(null);

      // Act
      await service.findOrCreate('6281234567890', 'New Name');

      // Assert
      expect(existingUser.update).toHaveBeenCalledWith({ name: 'New Name' });
    });
  });

  describe('checkSpam', () => {
    it('should return true if user sent more than 50 messages in 5 minutes', async () => {
      // Arrange
      chatHistoryModel.count.mockResolvedValue(51);

      // Act
      const result = await service.checkSpam(1);

      // Assert
      expect(result).toBe(true);
      expect(chatHistoryModel.count).toHaveBeenCalled();
    });

    it('should return false if user sent less than 50 messages in 5 minutes', async () => {
      // Arrange
      chatHistoryModel.count.mockResolvedValue(10);

      // Act
      const result = await service.checkSpam(1);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('blockUser', () => {
    it('should block user successfully', async () => {
      // Arrange
      const mockUser = {
        ...sampleUser,
        update: jest.fn().mockResolvedValue(undefined),
      };
      userModel.findByPk.mockResolvedValue(mockUser);

      // Act
      const result = await service.blockUser(1);

      // Assert
      expect(result).toBe(true);
      expect(mockUser.update).toHaveBeenCalledWith({ status: UserStatus.BLOCK });
    });

    it('should return false if user not found', async () => {
      // Arrange
      userModel.findByPk.mockResolvedValue(null);

      // Act
      const result = await service.blockUser(999);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isBlocked', () => {
    it('should return true for blocked user', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue({
        ...sampleUser,
        status: UserStatus.BLOCK,
      });

      // Act
      const result = await service.isBlocked('6281234567890');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for active user', async () => {
      // Arrange
      userModel.findOne.mockResolvedValue({
        ...sampleUser,
        status: UserStatus.ACTIVE,
      });

      // Act
      const result = await service.isBlocked('6281234567890');

      // Assert
      expect(result).toBe(false);
    });
  });
});
