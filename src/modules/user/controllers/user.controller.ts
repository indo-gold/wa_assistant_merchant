/**
 * ============================================================================
 * USER CONTROLLER
 * ============================================================================
 *
 * Controller untuk user management endpoints.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserService } from '../services/user.service';
import { UserStatus } from '../../../database/models';
import { InternalApiGuard } from '../../../common/guards/internal-api.guard';

/**
 * DTO untuk update status user
 */
export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsEnum(UserStatus)
  status!: UserStatus;
}

@ApiTags('User')
@UseGuards(InternalApiGuard)
@Controller('internal/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * ==========================================================================
   * GET USER BY ID
   * ==========================================================================
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      success: true,
      data: user,
    };
  }

  /**
   * ==========================================================================
   * UPDATE USER STATUS
   * ==========================================================================
   * Endpoint untuk block, unblock, atau set silent_bot status
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user status (block/unblock/silent)' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'block', 'silent_bot'],
          description: 'New status for the user',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    // Validate status
    const validStatuses = [UserStatus.ACTIVE, UserStatus.BLOCK, UserStatus.SILENT_BOT];
    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const user = await this.userService.updateStatus(id, dto.status);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: `User status updated to ${dto.status}`,
      data: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        status: user.status,
      },
    };
  }

  /**
   * ==========================================================================
   * BLOCK USER
   * ==========================================================================
   * Shortcut endpoint untuk block user
   */
  @Patch(':id/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block user' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async blockUser(@Param('id', ParseIntPipe) id: number) {
    const success = await this.userService.blockUser(id);
    if (!success) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User blocked successfully',
    };
  }

  /**
   * ==========================================================================
   * UNBLOCK USER
   * ==========================================================================
   * Shortcut endpoint untuk unblock user (set status ke active)
   */
  @Patch(':id/unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock user' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unblockUser(@Param('id', ParseIntPipe) id: number) {
    const success = await this.userService.unblockUser(id);
    if (!success) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User unblocked successfully',
    };
  }
}
