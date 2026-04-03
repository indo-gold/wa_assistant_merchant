/**
 * ============================================================================
 * PRODUCT SERVICE UNIT TESTS
 * ============================================================================
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ProductService } from '../../../src/modules/product/services/product.service';
import { Product } from '../../../src/database/models';
import { mockProductModel, sampleProduct } from '../../mocks/database.mock';
import { Op } from 'sequelize';

describe('ProductService', () => {
  let service: ProductService;
  let productModel: ReturnType<typeof mockProductModel>;

  beforeEach(async () => {
    productModel = mockProductModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getModelToken(Product),
          useValue: productModel,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return all products when no filter', async () => {
      // Arrange
      const mockProducts = [sampleProduct, { ...sampleProduct, id: 2 }];
      productModel.findAll.mockResolvedValue(mockProducts);

      // Act
      const result = await service.getProducts();

      // Assert
      expect(productModel.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['product_name', 'ASC'], ['denomination', 'ASC']],
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by product name', async () => {
      // Arrange
      productModel.findAll.mockResolvedValue([sampleProduct]);

      // Act
      const result = await service.getProducts({ product_name: 'Emas' });

      // Assert
      expect(productModel.findAll).toHaveBeenCalledWith({
        where: {
          product_name: { [Op.like]: '%Emas%' },
        },
        order: [['product_name', 'ASC'], ['denomination', 'ASC']],
      });
    });

    it('should filter by in_stock', async () => {
      // Arrange
      productModel.findAll.mockResolvedValue([sampleProduct]);

      // Act
      const result = await service.getProducts({ in_stock: true });

      // Assert
      expect(productModel.findAll).toHaveBeenCalledWith({
        where: {
          max_quantity: { [Op.gt]: 0 },
        },
        order: [['product_name', 'ASC'], ['denomination', 'ASC']],
      });
    });

    it('should filter by search', async () => {
      // Arrange
      productModel.findAll.mockResolvedValue([sampleProduct]);

      // Act
      const result = await service.getProducts({ search: 'Antam' });

      // Assert
      expect(productModel.findAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { product_name: { [Op.like]: '%Antam%' } },
            { variant_name: { [Op.like]: '%Antam%' } },
          ],
        },
        order: [['product_name', 'ASC'], ['denomination', 'ASC']],
      });
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(sampleProduct);

      // Act
      const result = await service.getProductById(1);

      // Assert
      expect(productModel.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBeDefined();
    });

    it('should return null if product not found', async () => {
      // Arrange
      productModel.findByPk.mockResolvedValue(null);

      // Act
      const result = await service.getProductById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getProductsByBudget', () => {
    it('should return products within budget', async () => {
      // Arrange
      const budgetProducts = [
        { ...sampleProduct, price: 500000 },
        { ...sampleProduct, id: 2, price: 800000 },
      ];
      productModel.findAll.mockResolvedValue(budgetProducts);

      // Act
      const result = await service.getProductsByBudget(1000000);

      // Assert
      expect(productModel.findAll).toHaveBeenCalledWith({
        where: {
          max_quantity: { [Op.gt]: 0 },
          [Op.or]: [
            { price: { [Op.lte]: 1000000 } },
            {
              [Op.and]: [
                { discount_price: { [Op.gt]: 0 } },
                { discount_price: { [Op.lte]: 1000000 } },
              ],
            },
          ],
        },
        order: [['price', 'ASC']],
      });
      expect(result).toHaveLength(2);
    });
  });
});
