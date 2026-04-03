/**
 * ============================================================================
 * PRODUCT MODULE
 * ============================================================================
 * 
 * Module untuk product catalog management.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from '../../database/models';
import { ProductService } from './services/product.service';

@Module({
  imports: [SequelizeModule.forFeature([Product])],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
