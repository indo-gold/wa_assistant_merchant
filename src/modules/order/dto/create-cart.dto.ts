/**
 * ============================================================================
 * CREATE CART DTO
 * ============================================================================
 * 
 * DTO untuk membuat cart baru.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { IsNumber, IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CartProductDto {
  @IsNumber()
  product_id!: number;

  @IsString()
  product_name!: string;

  @IsNumber()
  variant_id!: number;

  @IsString()
  variant_name!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  denomination!: number;

  @IsNumber()
  max_quantity!: number;

  @IsNumber()
  price!: number;

  @IsNumber()
  discount_price!: number;

  @IsNumber()
  is_po!: number;

  @IsNumber()
  automatic_po!: number;

  @IsNumber()
  est_date_po!: number;

  @IsNumber()
  stock_po!: number;
}

export class CreateCartDto {
  @IsNumber()
  @IsNotEmpty()
  user_id!: number;

  @IsString()
  @IsNotEmpty()
  wa_message_id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartProductDto)
  products!: CartProductDto[];
}
