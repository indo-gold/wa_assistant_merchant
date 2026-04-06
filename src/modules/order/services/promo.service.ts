/**
 * ============================================================================
 * PROMO SERVICE
 * ============================================================================
 *
 * Service untuk mengelola promo: validasi, perhitungan diskon,
 * auto-apply ke cart/order, dan tracking usage.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Promo, PromoProduct, PromoUsageLog, Product } from '../../../database/models';

export interface AppliedPromo {
  promoId: number;
  promoName: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  isSingleProduct: boolean;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  variant_name?: string;
  quantity: number;
  denomination?: number;
  price: number;
}

@Injectable()
export class PromoService {
  private readonly logger = new Logger(PromoService.name);

  constructor(
    @InjectModel(Promo)
    private readonly promoModel: typeof Promo,
    @InjectModel(PromoProduct)
    private readonly promoProductModel: typeof PromoProduct,
    @InjectModel(PromoUsageLog)
    private readonly promoUsageLogModel: typeof PromoUsageLog,
  ) {}

  /**
   * ==========================================================================
   * GET ACTIVE PROMOS FOR PRODUCTS
   * ==========================================================================
   * Cari semua promo aktif yang berlaku untuk list product IDs.
   */
  async getActivePromosForProducts(productIds: number[]): Promise<Promo[]> {
    const now = new Date();

    if (!productIds || productIds.length === 0) {
      return this.promoModel.findAll({
        where: {
          is_active: true,
          start_date: { [Op.lte]: now },
          end_date: { [Op.gte]: now },
          applies_to_all_products: true,
        },
        include: [
          {
            model: Product,
            through: { attributes: [] },
          },
        ],
        order: [['discount_value', 'DESC']],
      });
    }

    const promoProducts = await this.promoProductModel.findAll({
      where: { product_id: { [Op.in]: productIds } },
      attributes: ['promo_id'],
    });
    const promoIds = [...new Set(promoProducts.map((pp) => pp.promo_id))];

    return this.promoModel.findAll({
      where: {
        is_active: true,
        start_date: { [Op.lte]: now },
        end_date: { [Op.gte]: now },
        [Op.or]: [
          { applies_to_all_products: true },
          { id: { [Op.in]: promoIds } },
        ],
      },
      include: [
        {
          model: Product,
          through: { attributes: [] },
        },
      ],
      order: [['discount_value', 'DESC']],
    });
  }

  /**
   * ==========================================================================
   * CHECK USER PROMO ELIGIBILITY
   * ==========================================================================
   */
  async isUserEligibleForPromo(promo: Promo, userId: number): Promise<boolean> {
    // Cek global usage limit
    if (promo.usage_limit !== null && promo.usage_limit > 0) {
      const globalUsage = await this.promoUsageLogModel.count({
        where: { promo_id: promo.id },
      });
      if (globalUsage >= promo.usage_limit) {
        this.logger.log(`Promo ${promo.id} global limit reached`);
        return false;
      }
    }

    // Cek per-user usage limit
    if (promo.max_usage_per_user !== null && promo.max_usage_per_user > 0) {
      const userUsage = await this.promoUsageLogModel.count({
        where: { promo_id: promo.id, user_id: userId },
      });
      if (userUsage >= promo.max_usage_per_user) {
        this.logger.log(`User ${userId} has reached max usage for promo ${promo.id}`);
        return false;
      }
    }

    return true;
  }

  /**
   * ==========================================================================
   * CALCULATE DISCOUNT
   * ==========================================================================
   */
  calculateDiscount(promo: Promo, originalAmount: number): number {
    if (originalAmount < Number(promo.min_purchase_amount || 0)) {
      return 0;
    }

    let discount = 0;

    switch (promo.discount_type) {
      case 'percentage':
        discount = originalAmount * (Number(promo.discount_value) / 100);
        break;
      case 'fixed_amount':
        discount = Number(promo.discount_value);
        break;
      case 'free_shipping':
        // Free shipping tidak mengurangi harga produk langsung
        // Bisa dihandle terpisah saat checkout
        discount = 0;
        break;
      default:
        discount = 0;
    }

    // Apply max discount cap
    if (promo.max_discount_amount && promo.max_discount_amount > 0) {
      discount = Math.min(discount, Number(promo.max_discount_amount));
    }

    // Diskon tidak boleh melebihi total harga
    return Math.min(discount, originalAmount);
  }

  /**
   * ==========================================================================
   * FIND BEST PROMO FOR CART
   * ==========================================================================
   * Cari promo terbaik yang bisa di-apply ke cart user.
   */
  async findBestPromoForCart(
    cartItems: CartItem[],
    userId: number,
  ): Promise<AppliedPromo | null> {
    if (!cartItems || cartItems.length === 0) return null;

    const productIds = cartItems.map((item) => item.product_id);
    const promos = await this.getActivePromosForProducts(productIds);

    if (promos.length === 0) return null;

    const originalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    let bestPromo: AppliedPromo | null = null;

    for (const promo of promos) {
      const eligible = await this.isUserEligibleForPromo(promo, userId);
      if (!eligible) continue;

      const promoProductIds = (promo.products || []).map((p: any) => p.id);

      // Kalau tidak applies_to_all_products, cek apakah SEMUA item di cart eligible
      if (!promo.applies_to_all_products) {
        const allItemsEligible = cartItems.every((item) =>
          promoProductIds.includes(item.product_id),
        );
        if (!allItemsEligible) continue;
      }

      let applicableAmount = originalAmount;

      // Kalau promo hanya untuk 1 produk, hitung diskon dari produk pertama yang eligible saja
      if (promo.is_single_product_promo) {
        const firstEligible = cartItems.find((item) =>
          promo.applies_to_all_products || promoProductIds.includes(item.product_id),
        );
        applicableAmount = firstEligible ? firstEligible.price * firstEligible.quantity : 0;
      }

      const discountAmount = this.calculateDiscount(promo, applicableAmount);
      if (discountAmount <= 0) continue;

      if (!bestPromo || discountAmount > bestPromo.discountAmount) {
        bestPromo = {
          promoId: promo.id,
          promoName: promo.name,
          discountType: promo.discount_type,
          discountValue: Number(promo.discount_value),
          discountAmount,
          originalAmount: applicableAmount,
          finalAmount: applicableAmount - discountAmount,
          isSingleProduct: promo.is_single_product_promo,
        };
      }
    }

    return bestPromo;
  }

  /**
   * ==========================================================================
   * FIND BEST PROMO FOR SINGLE PRODUCT
   * ==========================================================================
   * Untuk rincian pesanan single product.
   */
  async findBestPromoForProduct(
    product: CartItem,
    userId: number,
  ): Promise<AppliedPromo | null> {
    const promos = await this.getActivePromosForProducts([product.product_id]);

    if (promos.length === 0) return null;

    const originalAmount = product.price * product.quantity;
    let bestPromo: AppliedPromo | null = null;

    for (const promo of promos) {
      const eligible = await this.isUserEligibleForPromo(promo, userId);
      if (!eligible) continue;

      // Kalau tidak applies_to_all_products, cek produk ini termasuk
      if (!promo.applies_to_all_products) {
        const promoProductIds = (promo.products || []).map((p: any) => p.id);
        if (!promoProductIds.includes(product.product_id)) continue;
      }

      let applicableAmount = originalAmount;

      // Kalau promo single product, diskon hanya dihitung dari produk ini saja
      if (promo.is_single_product_promo) {
        applicableAmount = product.price * product.quantity;
      }

      const discountAmount = this.calculateDiscount(promo, applicableAmount);
      if (discountAmount <= 0) continue;

      if (!bestPromo || discountAmount > bestPromo.discountAmount) {
        bestPromo = {
          promoId: promo.id,
          promoName: promo.name,
          discountType: promo.discount_type,
          discountValue: Number(promo.discount_value),
          discountAmount,
          originalAmount: applicableAmount,
          finalAmount: applicableAmount - discountAmount,
          isSingleProduct: promo.is_single_product_promo,
        };
      }
    }

    return bestPromo;
  }

  /**
   * ==========================================================================
   * LOG PROMO USAGE
   * ==========================================================================
   */
  async logPromoUsage(
    promoId: number,
    userId: number,
    orderId: number,
    discountAmount: number,
  ): Promise<void> {
    await this.promoUsageLogModel.create({
      promo_id: promoId,
      user_id: userId,
      order_id: orderId,
      discount_amount: discountAmount,
    });
    this.logger.log(`Promo ${promoId} used by user ${userId} for order ${orderId}, discount=${discountAmount}`);
  }
}
