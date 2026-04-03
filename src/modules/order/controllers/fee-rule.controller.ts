/**
 * ============================================================================
 * FEE RULE CONTROLLER
 * ============================================================================
 *
 * Controller untuk mengelola Xendit Fee Rules.
 * Fee rules dibuat via API (tidak ada UI di Xendit Dashboard).
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Controller, Post, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { XenditService } from '../services/xendit.service';
import { CreateFeeRuleDto } from '../dto/create-fee-rule.dto';

@ApiTags('Fee Rules')
@Controller('admin/fee-rules')
export class FeeRuleController {
  private readonly logger = new Logger(FeeRuleController.name);

  constructor(private readonly xenditService: XenditService) {}

  /**
   * ==========================================================================
   * CREATE FEE RULE
   * ==========================================================================
   * Membuat fee rule baru di Xendit untuk platform fee
   */
  @Post()
  @ApiOperation({ summary: 'Create Xendit Fee Rule' })
  @ApiResponse({ status: 201, description: 'Fee rule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 500, description: 'Xendit API error' })
  async createFeeRule(@Body() dto: CreateFeeRuleDto) {
    try {
      this.logger.log(`Creating fee rule: ${dto.name}`);

      const feeRule = await this.xenditService.createFeeRule({
        name: dto.name,
        description: dto.description || '',
        unit: dto.unit,
        amount: dto.amount,
      });

      return {
        success: true,
        message: 'Fee rule created successfully',
        data: {
          id: feeRule.id,
          name: feeRule.name,
          unit: feeRule.unit,
          amount: feeRule.amount,
          status: feeRule.status,
        },
        note: 'Copy the fee rule ID to your .env file: XENDIT_FEE_RULE_ID=' + feeRule.id,
      };
    } catch (error) {
      this.logger.error(`Failed to create fee rule: ${(error as Error).message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create fee rule',
          error: (error as Error).message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
