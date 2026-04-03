/**
 * ============================================================================
 * USER SERVICE
 * ============================================================================
 * 
 * Service untuk user management.
 * 
 * Fitur:
 * - CRUD user operations
 * - Find or create user (untuk WhatsApp webhook)
 * - Spam detection
 * - User penalty management
 * - User personalization
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User, UserStatus, ChatHistory } from '../../../database/models';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

/**
 * User dengan additional info
 */
export interface UserWithInfo {
  id: number;
  name: string;
  phone_number: string;
  status: UserStatus;
  timestamp: Date;
  isNew?: boolean;
  lastMessageDays?: number;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(ChatHistory)
    private chatHistoryModel: typeof ChatHistory,
  ) {}

  /**
   * ==========================================================================
   * FIND OR CREATE USER
   * ==========================================================================
   * Find user by phone number atau create jika tidak exists.
   * Digunakan saat menerima pesan WhatsApp.
   */
  async findOrCreate(phoneNumber: string, name: string): Promise<UserWithInfo> {
    let user = await this.userModel.findOne({
      where: { phone_number: phoneNumber },
    });

    if (user) {
      // Update name jika berubah
      if (user.name !== name) {
        await user.update({ name });
      }

      // Hitung hari sejak pesan terakhir
      const lastMessageDays = await this.getDaysSinceLastMessage(user.id);
      
      return { ...user.toJSON(), isNew: false, lastMessageDays };
    }

    // Create new user
    user = await this.userModel.create({
      name: name || 'Anonymous',
      phone_number: phoneNumber,
      status: UserStatus.ACTIVE,
    });

    this.logger.log(`New user created: ${phoneNumber} (${name})`);
    
    return { ...user.toJSON(), isNew: true };
  }

  /**
   * ==========================================================================
   * FIND BY PHONE NUMBER
   * ==========================================================================
   */
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { phone_number: phoneNumber },
    });
  }

  /**
   * ==========================================================================
   * FIND BY ID
   * ==========================================================================
   */
  async findById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  /**
   * ==========================================================================
   * CREATE USER
   * ==========================================================================
   */
  async create(dto: CreateUserDto): Promise<User> {
    return this.userModel.create({
      name: dto.name,
      phone_number: dto.phone_number,
      status: dto.status || UserStatus.ACTIVE,
    });
  }

  /**
   * ==========================================================================
   * UPDATE USER
   * ==========================================================================
   */
  async update(id: number, dto: UpdateUserDto): Promise<User | null> {
    const user = await this.userModel.findByPk(id);
    if (!user) return null;

    await user.update(dto);
    return user;
  }

  /**
   * ==========================================================================
   * BLOCK USER
   * ==========================================================================
   */
  async blockUser(id: number): Promise<boolean> {
    const user = await this.userModel.findByPk(id);
    if (!user) return false;

    await user.update({ status: UserStatus.BLOCK });
    this.logger.warn(`User blocked: ${user.phone_number}`);
    return true;
  }

  /**
   * ==========================================================================
   * CHECK SPAM
   * ==========================================================================
   * Check apakah user melakukan spam (>50 messages dalam 5 menit).
   * Returns: true jika spam, false jika normal
   */
  async checkSpam(userId: number): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const now = new Date();

    const count = await this.chatHistoryModel.count({
      where: {
        user_id: userId,
        role: 'user',
        timestamp: {
          [Op.between]: [fiveMinutesAgo, now],
        },
      },
    });

    return count > 50;
  }

  /**
   * ==========================================================================
   * GET DAYS SINCE LAST MESSAGE
   * ==========================================================================
   * Hitung berapa hari sejak pesan terakhir dari user.
   */
  private async getDaysSinceLastMessage(userId: number): Promise<number | undefined> {
    const lastMessage = await this.chatHistoryModel.findOne({
      where: {
        user_id: userId,
        role: 'user',
      },
      order: [['timestamp', 'DESC']],
    });

    if (!lastMessage) return undefined;

    const diffInMs = Date.now() - new Date(lastMessage.timestamp).getTime();
    return diffInMs / (1000 * 60 * 60 * 24);
  }

  /**
   * ==========================================================================
   * IS USER BLOCKED
   * ==========================================================================
   */
  async isBlocked(phoneNumber: string): Promise<boolean> {
    const user = await this.findByPhoneNumber(phoneNumber);
    return user?.status === UserStatus.BLOCK;
  }

  /**
   * ==========================================================================
   * IS SILENT BOT
   * ==========================================================================
   * Check apakah bot dalam mode silent untuk user ini.
   */
  async isSilentBot(phoneNumber: string): Promise<boolean> {
    const user = await this.findByPhoneNumber(phoneNumber);
    return user?.status === UserStatus.SILENT_BOT;
  }
}
