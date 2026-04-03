/**
 * ============================================================================
 * DATABASE MOCKS
 * ============================================================================
 * 
 * Mock classes untuk Sequelize models dalam testing.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { User, UserStatus, ChatHistory, Product, Cart, Order } from '../../src/database/models';

/**
 * Mock User Model
 */
export const mockUserModel = () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
});

/**
 * Mock ChatHistory Model
 */
export const mockChatHistoryModel = () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
});

/**
 * Mock Product Model
 */
export const mockProductModel = () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

/**
 * Mock Cart Model
 */
export const mockCartModel = () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

/**
 * Mock Order Model
 */
export const mockOrderModel = () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

/**
 * Sample User Data
 */
export const sampleUser = {
  id: 1,
  name: 'John Doe',
  phone_number: '6281234567890',
  status: UserStatus.ACTIVE,
  timestamp: new Date(),
  toJSON: () => ({
    id: 1,
    name: 'John Doe',
    phone_number: '6281234567890',
    status: UserStatus.ACTIVE,
    timestamp: new Date(),
  }),
  update: jest.fn(),
} as unknown as User;

/**
 * Sample Chat History Data
 */
export const sampleChatHistory = {
  id: 1,
  user_id: 1,
  wa_message_id: 'wamid.123456',
  message: 'Hello',
  role: 'user',
  type: 'text',
  timestamp: new Date(),
} as unknown as ChatHistory;

/**
 * Sample Product Data
 */
export const sampleProduct = {
  id: 1,
  product_name: 'Emas Antam',
  variant_name: 'Classic',
  price: 1000000,
  discount_price: 950000,
  max_quantity: 100,
  is_po: 0,
  timestamp: new Date(),
} as unknown as Product;
