/**
 * ============================================================================
 * CART SERVICE
 * ============================================================================
 * 
 * Service untuk cart management.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cart, CartStatus } from '../../../database/models';
import { CreateCartDto } from '../dto/create-cart.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectModel(Cart)
    private readonly cartModel: typeof Cart,
  ) {}

  /**
   * ==========================================================================
   * CREATE CART
   * ==========================================================================
   */
  async createCart(dto: CreateCartDto): Promise<Cart> {
    const cart = await this.cartModel.create({
      user_id: dto.user_id,
      wa_message_id: dto.wa_message_id,
      json_order: dto.products,
      status_order: CartStatus.PENDING,
    });

    this.logger.log(`Cart created: ${cart.id} for user ${dto.user_id}`);
    return cart;
  }

  /**
   * ==========================================================================
   * GET CART BY ID
   * ==========================================================================
   */
  async getCartById(id: number): Promise<Cart | null> {
    return this.cartModel.findByPk(id);
  }

  /**
   * ==========================================================================
   * GET PENDING CART BY USER
   * ==========================================================================
   * Get cart pending terakhir untuk user.
   */
  async getPendingCartByUser(userId: number): Promise<Cart | null> {
    return this.cartModel.findOne({
      where: {
        user_id: userId,
        status_order: CartStatus.PENDING,
      },
      order: [['timestamp', 'DESC']],
    });
  }

  /**
   * ==========================================================================
   * GET CART BY WA MESSAGE ID
   * ==========================================================================
   */
  async getCartByWaMessageId(waMessageId: string): Promise<Cart | null> {
    return this.cartModel.findOne({
      where: { wa_message_id: waMessageId },
    });
  }

  /**
   * ==========================================================================
   * UPDATE CART STATUS
   * ==========================================================================
   */
  async updateCartStatus(
    cartId: number,
    status: CartStatus,
  ): Promise<boolean> {
    const [updated] = await this.cartModel.update(
      { status_order: status },
      { where: { id: cartId } },
    );

    return updated > 0;
  }

  /**
   * ==========================================================================
   * UPDATE WA MESSAGE ID
   * ==========================================================================
   * Update WA message ID untuk cart (setelah kirim interactive message).
   */
  async updateWaMessageId(
    cartId: number,
    waMessageId: string,
  ): Promise<boolean> {
    const [updated] = await this.cartModel.update(
      { wa_message_id: waMessageId },
      { where: { id: cartId } },
    );

    return updated > 0;
  }

  /**
   * ==========================================================================
   * UPDATE FOLLOW UP
   * ==========================================================================
   */
  async updateFollowUp(cartId: number): Promise<boolean> {
    const [updated] = await this.cartModel.update(
      { follow_up: Math.floor(Date.now() / 1000) },
      { where: { id: cartId } },
    );

    return updated > 0;
  }

  /**
   * ==========================================================================
   * GET CARTS FOR FOLLOW UP
   * ==========================================================================
   * Get carts yang perlu di-follow up (pending, belum follow up, 4 jam yang lalu).
   */
  async getCartsForFollowUp(hoursAgo: number = 4): Promise<Cart[]> {
    const startTime = new Date(Date.now() - (hoursAgo + 0.5) * 60 * 60 * 1000);
    const endTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    return this.cartModel.findAll({
      where: {
        status_order: CartStatus.PENDING,
        follow_up: null,
        timestamp: {
          [Op.between]: [startTime, endTime],
        },
      },
      include: ['User'],
    });
  }
}

// Import Op untuk query
import { Op } from 'sequelize';
