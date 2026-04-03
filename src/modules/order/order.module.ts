import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
/**
 * ============================================================================
 * ORDER MODULE
 * ============================================================================
 *
 * Module untuk order dan cart management dengan Xendit Payment Integration.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Module } from '@nestjs/common';

import { OrderService } from './services/order.service';
import { CartService } from './services/cart.service';
import { XenditService } from './services/xendit.service';
import { FeeRuleController } from './controllers/fee-rule.controller';
import {
  Cart,
  Order,
  OrderPayment,
  OrderOtp,
} from '../../database/models';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Cart,
      Order,
      OrderPayment,
      OrderOtp,
    ]),
    HttpModule,
  ],
  controllers: [FeeRuleController],
  providers: [CartService, OrderService, XenditService],
  exports: [CartService, OrderService, XenditService],
})
export class OrderModule {}
