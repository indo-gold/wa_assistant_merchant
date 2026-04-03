/**
 * ============================================================================
 * CREATE FEE RULE DTO
 * ============================================================================
 * DTO untuk membuat Xendit Fee Rule
 */
import { IsString, IsNumber, IsIn, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FeeRouteDto {
  @IsString()
  type!: 'master_account' | 'sub_account';

  @IsString()
  @IsOptional()
  sub_account_id?: string;

  @IsNumber()
  @IsOptional()
  percent_amount?: number;

  @IsNumber()
  @IsOptional()
  flat_amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class CreateFeeRuleDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(['percentage', 'flat', 'PERCENT', 'FLAT'])
  unit!: 'percentage' | 'flat' | 'PERCENT' | 'FLAT';

  @IsNumber()
  amount!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeRouteDto)
  @IsOptional()
  routes?: FeeRouteDto[];
}
