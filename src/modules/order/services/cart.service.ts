/**
 * ============================================================================
 * CART SERVICE
 * ============================================================================
 * 
 * Service untuk cart management dengan price lock & expiry.
 * 
 * Features:
 * - Cart creation dengan expiry otomatis (24 jam)
 * - Price locking saat user melihat rincian
 * - Validasi harga real-time
 * - Auto-cancel expired carts
 * 
 * @author IndoGold Team
 * @version 1.1.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Cart, CartStatus, PriceSnapshot } from '../../../database/models';
import { CreateCartDto } from '../dto/create-cart.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  
  // Konstanta konfigurasi
  private readonly CART_EXPIRY_MINUTES = 5; // Cart expired dalam 5 menit
  private readonly PRICE_LOCK_MINUTES = 5; // Price lock 5 menit

  constructor(
    @InjectModel(Cart)
    private readonly cartModel: typeof Cart,
  ) {}

  /**
   * ==========================================================================
   * CREATE CART
   * ==========================================================================
   * Membuat cart baru dengan expiry otomatis 24 jam
   * dan menyimpan snapshot harga produk
   */
  async createCart(dto: CreateCartDto): Promise<Cart> {
    const expiresAt = new Date(Date.now() + this.CART_EXPIRY_MINUTES * 60 * 1000);
    
    // Buat price snapshot dari produk
    const priceSnapshot: PriceSnapshot[] = dto.products.map(product => ({
      product_id: product.product_id,
      product_name: product.product_name,
      price_at_creation: product.discount_price > 0 ? product.discount_price : product.price,
      price_current: product.discount_price > 0 ? product.discount_price : product.price,
      timestamp: new Date().toISOString(),
    }));

    const cart = await this.cartModel.create({
      user_id: dto.user_id,
      wa_message_id: dto.wa_message_id,
      json_order: dto.products,
      status_order: CartStatus.PENDING,
      expires_at: expiresAt,
      original_prices_snapshot: priceSnapshot,
      price_lock_duration_minutes: this.PRICE_LOCK_MINUTES,
    });

    this.logger.log(`Cart created: ${cart.id} for user ${dto.user_id}, expires at ${expiresAt.toISOString()}`);
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
   * LOCK CART PRICES
   * ==========================================================================
   * Lock harga cart saat user melihat rincian pesanan.
   * Harga akan di-lock selama 30 menit.
   */
  async lockCartPrices(cartId: number): Promise<Cart | null> {
    const [updated] = await this.cartModel.update(
      { 
        price_locked_at: new Date(),
        price_validated_at: new Date(),
      },
      { 
        where: { 
          id: cartId,
          status_order: CartStatus.PENDING,
        },
        returning: true,
      },
    );

    if (updated > 0) {
      this.logger.log(`Cart ${cartId} prices locked for ${this.PRICE_LOCK_MINUTES} minutes`);
      return this.getCartById(cartId);
    }

    return null;
  }

  /**
   * ==========================================================================
   * VALIDATE CART EXPIRY
   * ==========================================================================
   * Cek apakah cart masih valid (belum expired).
   * Jika sudah expired, update status ke EXPIRED.
   */
  async validateCartExpiry(cartId: number): Promise<{ valid: boolean; cart?: Cart; message?: string }> {
    const cart = await this.getCartById(cartId);
    
    if (!cart) {
      return { valid: false, message: 'Keranjang tidak ditemukan.' };
    }

    if (cart.status_order === CartStatus.EXPIRED) {
      return { valid: false, cart, message: 'Keranjang sudah expired.' };
    }

    if (cart.status_order === CartStatus.CANCELLED) {
      return { valid: false, cart, message: 'Keranjang telah dibatalkan.' };
    }

    if (cart.status_order !== CartStatus.PENDING) {
      return { valid: false, cart, message: 'Keranjang tidak aktif.' };
    }

    // Cek expiry
    if (cart.isExpired()) {
      await this.expireCart(cartId);
      return { 
        valid: false, 
        cart, 
        message: `⏰ Keranjang telah expired (melebihi ${this.CART_EXPIRY_MINUTES} menit). Silakan buat pesanan baru dengan harga terkini.` 
      };
    }

    return { valid: true, cart };
  }

  /**
   * ==========================================================================
   * VALIDATE PRICE LOCK (Atomic)
   * ==========================================================================
   * Validasi bahwa cart masih PENDING dan price lock belum expired.
   * Mencegah race condition antara validasi dan payment creation.
   */
  async validatePriceLock(cartId: number): Promise<{ valid: boolean; message?: string }> {
    const lockCutoff = new Date(Date.now() - this.PRICE_LOCK_MINUTES * 60 * 1000);

    const cart = await this.cartModel.findOne({
      where: {
        id: cartId,
        status_order: CartStatus.PENDING,
        price_locked_at: { [Op.gte]: lockCutoff },
      },
    });

    if (!cart) {
      return {
        valid: false,
        message: 'Harga sudah berubah atau keranjang expired. Silakan buat pesanan baru.',
      };
    }

    return { valid: true };
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
   * EXPIRE CART
   * ==========================================================================
   * Tandai cart sebagai expired
   */
  async expireCart(cartId: number): Promise<boolean> {
    const [updated] = await this.cartModel.update(
      { status_order: CartStatus.EXPIRED },
      { where: { id: cartId } },
    );

    if (updated > 0) {
      this.logger.log(`Cart ${cartId} marked as expired`);
    }

    return updated > 0;
  }

  /**
   * ==========================================================================
   * CANCEL CART
   * ==========================================================================
   */
  async cancelCart(cartId: number): Promise<boolean> {
    return this.updateCartStatus(cartId, CartStatus.CANCELLED);
  }

  /**
   * ==========================================================================
   * UPDATE FOLLOW UP
   * ==========================================================================
   */
  async updateFollowUp(cartId: number): Promise<boolean> {
    const [updated] = await this.cartModel.update(
      { follow_up: new Date() },
      { where: { id: cartId } },
    );

    return updated > 0;
  }

  /**
   * ==========================================================================
   * GET CARTS FOR FOLLOW UP
   * ==========================================================================
   * Get carts yang perlu di-follow up (pending, belum follow up, 2 menit yang lalu).
   * Hanya mengembalikan cart yang belum expired.
   * Note: Karena cart hanya 5 menit, follow up dilakukan setelah 2 menit.
   */
  async getCartsForFollowUp(minutesAgo: number = 2): Promise<Cart[]> {
    const startTime = new Date(Date.now() - (minutesAgo + 1) * 60 * 1000);
    const endTime = new Date(Date.now() - minutesAgo * 60 * 1000);

    return this.cartModel.findAll({
      where: {
        status_order: CartStatus.PENDING,
        follow_up: null,
        timestamp: {
          [Op.between]: [startTime, endTime],
        },
        expires_at: {
          [Op.gt]: new Date(), // Belum expired
        },
      },
      include: ['user'],
    });
  }
}
