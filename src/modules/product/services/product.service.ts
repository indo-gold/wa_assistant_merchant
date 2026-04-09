import { InjectModel } from '@nestjs/sequelize';
/**
 * ============================================================================
 * PRODUCT SERVICE
 * ============================================================================
 *
 * Service untuk product catalog management.
 *
 * Fitur:
 * - Get products with filters
 * - Search products
 * - Get product variants
 * - Get price list
 * - Check stock availability
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Injectable } from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';

import { ProductFilterDto } from '../dto/product-filter.dto';
import { Product } from '../../../database/models';

/**
 * Product dengan stok info
 */
export interface ProductWithStock extends Product {
  is_available: boolean;
  stock_message: string;
}

/**
 * Product summary untuk AI context
 */
export interface ProductSummary {
  product_names: string[];
  variant_names: string[];
  product_variant_denom: string[];
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product)
    private productModel: typeof Product,
  ) {}

  /**
   * ==========================================================================
   * GET PRODUCTS
   * ==========================================================================
   * Get products dengan filtering.
   */
  async getProducts(filter: ProductFilterDto = {}): Promise<Product[]> {
    const where: any = {};

    if (filter.product_name) {
      where.product_name = { [Op.like]: `%${filter.product_name}%` };
    }

    if (filter.variant_name) {
      where.variant_name = { [Op.like]: `%${filter.variant_name}%` };
    }

    if (filter.min_denomination !== undefined) {
      where.denomination = { [Op.gte]: filter.min_denomination };
    }

    if (filter.max_denomination !== undefined) {
      where.denomination = { ...where.denomination, [Op.lte]: filter.max_denomination };
    }

    if (filter.max_price !== undefined) {
      where[Op.or] = [
        { price: { [Op.lte]: filter.max_price } },
        {
          [Op.and]: [
            { discount_price: { [Op.gt]: 0 } },
            { discount_price: { [Op.lte]: filter.max_price } },
          ],
        },
      ];
    }

    if (filter.in_stock) {
      where.max_quantity = { [Op.gt]: 0 };
    }

    if (filter.search) {
      where[Op.or] = [
        { product_name: { [Op.like]: `%${filter.search}%` } },
        { variant_name: { [Op.like]: `%${filter.search}%` } },
      ];
    }

    return this.productModel.findAll({
      where,
      order: [
        ['product_name', 'ASC'],
        ['denomination', 'ASC'],
      ],
    });
  }

  /**
   * ==========================================================================
   * GET PRODUCT BY ID
   * ==========================================================================
   */
  async getProductById(id: number): Promise<Product | null> {
    return this.productModel.findByPk(id);
  }

  /**
   * ==========================================================================
   * GET PRODUCT NAMES
   * ==========================================================================
   * Get unique product names.
   */
  async getProductNames(): Promise<string[]> {
    const products = await this.productModel.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('product_name')), 'product_name']],
      raw: true,
    });
    return products.map((p: any) => p.product_name);
  }

  /**
   * ==========================================================================
   * GET VARIANT NAMES
   * ==========================================================================
   * Get unique variant names.
   */
  async getVariantNames(): Promise<string[]> {
    const variants = await this.productModel.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('variant_name')), 'variant_name']],
      where: { variant_name: { [Op.ne]: '' } },
      raw: true,
    });
    return variants.map((v: any) => v.variant_name);
  }

  /**
   * ==========================================================================
   * GET PRODUCT SUMMARY
   * ==========================================================================
   * Get product summary untuk AI context.
   */
  async getProductSummary(): Promise<ProductSummary> {
    const products = await this.productModel.findAll();

    const productNames = [...new Set(products.map((p) => p.product_name))];
    const variantNames = [...new Set(products.map((p) => p.variant_name).filter(Boolean))];
    const productVariantDenom = products.map(
      (p) => `nama:${p.product_name} | variant:${p.variant_name} | berat:${p.denomination}`,
    );

    return {
      product_names: productNames,
      variant_names: variantNames,
      product_variant_denom: productVariantDenom,
    };
  }

  /**
   * ==========================================================================
   * GET PRODUCTS BY BUDGET
   * ==========================================================================
   * Get products yang sesuai dengan budget.
   */
  async getProductsByBudget(budget: number): Promise<Product[]> {
    return this.productModel.findAll({
      where: {
        max_quantity: { [Op.gt]: 0 },
        [Op.or]: [
          { price: { [Op.lte]: budget } },
          {
            [Op.and]: [
              { discount_price: { [Op.gt]: 0 } },
              { discount_price: { [Op.lte]: budget } },
            ],
          },
        ],
      },
      order: [['price', 'ASC']],
    });
  }

  /**
   * ==========================================================================
   * CHECK STOCK
   * ==========================================================================
   * Check apakah produk tersedia dengan quantity yang diminta.
   */
  async checkStock(
    productId: number,
    denomination: number,
    quantity: number,
  ): Promise<{ available: boolean; stock: number; isPreOrder: boolean }> {
    const product = await this.productModel.findOne({
      where: {
        product_id: productId,
        denomination,
      },
    });

    if (!product) {
      return { available: false, stock: 0, isPreOrder: false };
    }

    // Check regular stock
    if (product.max_quantity >= quantity) {
      return { available: true, stock: product.max_quantity, isPreOrder: false };
    }

    // Check pre-order stock
    if ((product.is_po || product.automatic_po) && product.stock_po >= quantity) {
      return { available: true, stock: product.stock_po, isPreOrder: true };
    }

    return { available: false, stock: product.max_quantity, isPreOrder: false };
  }

  /**
   * ==========================================================================
   * GET ALTERNATIVE PRODUCTS
   * ==========================================================================
   * Get alternative products jika produk yang diminta tidak tersedia.
   */
  async getAlternativeProducts(
    productName: string,
    denomination: number,
    variantName?: string,
    limit: number = 2,
  ): Promise<Product[]> {
    // Cari produk dengan denomination sama, stok tersedia
    let alternatives = await this.productModel.findAll({
      where: {
        max_quantity: { [Op.gt]: 0 },
        denomination,
        product_name: { [Op.like]: `%${productName}%` },
        ...(variantName && { variant_name: { [Op.notLike]: `%${variantName}%` } }),
      },
      limit,
    });

    // Jika tidak ada, cari dengan denomination lebih kecil
    if (alternatives.length === 0) {
      alternatives = await this.productModel.findAll({
        where: {
          max_quantity: { [Op.gt]: 0 },
          denomination: { [Op.lt]: denomination },
          product_name: { [Op.like]: `%${productName}%` },
        },
        order: [['denomination', 'DESC']],
        limit,
      });
    }

    // Jika masih tidak ada, cari dengan denomination lebih besar
    if (alternatives.length === 0) {
      alternatives = await this.productModel.findAll({
        where: {
          max_quantity: { [Op.gt]: 0 },
          denomination: { [Op.gt]: denomination },
          product_name: { [Op.like]: `%${productName}%` },
        },
        order: [['denomination', 'ASC']],
        limit,
      });
    }

    return alternatives;
  }

  /**
   * ==========================================================================
   * FORMAT PRICE LIST
   * ==========================================================================
   * Format produk untuk ditampilkan sebagai price list.
   */
  formatPriceList(products: Product[], userRequest: string): string {
    if (products.length === 0) {
      return `_Maaf, produk tidak tersedia saat ini._`;
    }

    // Group by product name
    const grouped = products.reduce(
      (acc, p) => {
        const key = `${p.product_name} ${p.variant_name || ''}`.trim();
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
      },
      {} as Record<string, Product[]>,
    );

    const formatRupiah = (num: number) =>
      'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const lines = Object.entries(grouped).map(([groupName, items], idx) => {
      const itemLines = items.map((p) => {
        const price =
          p.discount_price > 0
            ? `${formatRupiah(p.discount_price)} (diskon)`
            : `${formatRupiah(p.price)}`;
        const stokMsg = p.max_quantity > 0 ? `stok: tersedia` : 'stok: kosong';
        return `   - ${p.denomination}g - ${price} - (${stokMsg})`;
      });
      return `\n${idx + 1}. ${groupName}\n${itemLines.join('\n')}`;
    });

    return `Untuk ${userRequest}:\n${lines.join('\n')}\n\nBalas nomor produk untuk pesan, atau ketik *Lihat Lainnya* untuk pilihan lain.`;
  }
}
