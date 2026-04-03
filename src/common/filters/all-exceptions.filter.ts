/**
 * ============================================================================
 * ALL EXCEPTIONS FILTER
 * ============================================================================
 * 
 * Global exception filter untuk handling semua exception dalam aplikasi.
 * Menyediakan konsistent error response format dan logging.
 * 
 * Fitur:
 * - Catch semua tipe exception (HttpException, Error, unknown)
 * - Format error response yang konsisten
 * - Structured error logging
 * - Stack trace di development mode
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * ============================================================================
 * ERROR RESPONSE INTERFACE
 * ============================================================================
 * Interface untuk standard error response
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  stack?: string;
}

/**
 * ============================================================================
 * ALL EXCEPTIONS FILTER
 * ============================================================================
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * ==========================================================================
   * CATCH EXCEPTION
   * ==========================================================================
   * Method utama untuk catch dan handle exception
   * 
   * @param exception - Exception yang terjadi
   * @param host - ArgumentsHost untuk access request/response
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    // Determine status code
    const statusCode = this.getStatusCode(exception);

    // Determine error message
    const message = this.getErrorMessage(exception);

    // Determine error type
    const error = this.getErrorType(exception);

    // Build error response
    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = this.getStackTrace(exception);
    }

    // Log error
    this.logError(exception, request, statusCode);

    // Send response
    response.status(statusCode).send(errorResponse);
  }

  /**
   * ==========================================================================
   * GET STATUS CODE
   * ==========================================================================
   * Mendapatkan HTTP status code dari exception
   */
  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * ==========================================================================
   * GET ERROR MESSAGE
   * ==========================================================================
   * Mendapatkan error message dari exception
   */
  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null) {
        return (response as { message?: string | string[] }).message?.toString() || 'Error occurred';
      }
    }
    
    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Internal server error';
  }

  /**
   * ==========================================================================
   * GET ERROR TYPE
   * ==========================================================================
   * Mendapatkan error type/class name
   */
  private getErrorType(exception: unknown): string {
    if (exception instanceof HttpException) {
      return exception.name;
    }
    if (exception instanceof Error) {
      return exception.name;
    }
    return 'UnknownError';
  }

  /**
   * ==========================================================================
   * GET STACK TRACE
   * ==========================================================================
   * Mendapatkan stack trace untuk debugging
   */
  private getStackTrace(exception: unknown): string | undefined {
    if (exception instanceof Error) {
      return exception.stack;
    }
    return undefined;
  }

  /**
   * ==========================================================================
   * LOG ERROR
   * ==========================================================================
   * Log error dengan detail request
   */
  private logError(
    exception: unknown,
    request: FastifyRequest,
    statusCode: number,
  ): void {
    const logData = {
      statusCode,
      path: request.url,
      method: request.method,
      ip: request.ip,
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= 500) {
      this.logger.error(
        `🚨 Server Error: ${request.method} ${request.url} - ${statusCode}`,
        exception instanceof Error ? exception.stack : undefined,
        JSON.stringify(logData),
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `⚠️  Client Error: ${request.method} ${request.url} - ${statusCode}`,
        JSON.stringify(logData),
      );
    }
  }
}
