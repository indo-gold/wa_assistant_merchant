import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fastifyMultipart from '@fastify/multipart';
import { ValidationPipe } from '@nestjs/common';
import * as fastifyCors from '@fastify/cors';
/**
 * ============================================================================
 * MAIN ENTRY POINT - WhatsApp Assistant (NestJS + Fastify)
 * ============================================================================
 *
 * File ini adalah entry point utama aplikasi WhatsApp Assistant.
 * Menggunakan Fastify sebagai HTTP adapter untuk performa yang lebih baik.
 *
 * Fitur:
 * - Fastify adapter untuk high performance
 * - Pino logger untuk structured logging
 * - CORS configuration
 * - Multipart file upload support
 * - Global exception handling
 * - Swagger documentation
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppModule } from './app.module';

/**
 * Bootstrap function untuk inisialisasi aplikasi
 */
async function bootstrap(): Promise<void> {
  // ============================================================================
  // 1. CREATE FASTIFY ADAPTER
  // ============================================================================
  // Menggunakan Fastify sebagai HTTP server untuk performa yang lebih baik
  // dibandingkan dengan Express default NestJS
  // ============================================================================
  const fastifyAdapter = new FastifyAdapter({
    logger: false, // Disable default Fastify logger, menggunakan Pino
    trustProxy: true,
    bodyLimit: 1048576, // 1MB max JSON body
  });

  // Simpan raw body untuk webhook signature verification
  fastifyAdapter.getInstance().addHook('onRequest', (request: any, _reply: any, done: () => void) => {
    const chunks: Buffer[] = [];
    request.raw.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.raw.on('end', () => {
      (request as any).rawBody = Buffer.concat(chunks);
    });
    done();
  });

  // ============================================================================
  // 2. CREATE NESTJS APPLICATION
  // ============================================================================
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, {
    bufferLogs: true, // Buffer logs sampai logger siap
  });

  // ============================================================================
  // 3. REGISTER FASTIFY PLUGINS
  // ============================================================================

  // Register multipart plugin untuk file upload
  await app.register(fastifyMultipart as any, {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB max file size
      files: 1, // Max 1 file per request
    },
  });

  // Register CORS plugin - origins dari env var
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map(origin => origin.trim());

  await app.register(fastifyCors as any, {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-secret'],
    credentials: true,
  });

  // ============================================================================
  // 4. GLOBAL MIDDLEWARE & INTERCEPTORS
  // ============================================================================

  // Validation pipe untuk DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Hapus property yang tidak ada di DTO
      forbidNonWhitelisted: true, // Throw error jika ada property yang tidak diizinkan
      transform: true, // Auto transform payload ke instance DTO
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // ============================================================================
  // 5. SWAGGER DOCUMENTATION SETUP
  // ============================================================================
  const config = new DocumentBuilder()
    .setTitle('WhatsApp Assistant API')
    .setDescription('API documentation for WhatsApp Assistant - NestJS Refactor')
    .setVersion('1.0.0')
    .addBearerAuth() // JWT authentication
    .addTag('Auth', 'Authentication endpoints')
    .addTag('User', 'User management')
    .addTag('Chat', 'Chat history & conversation')
    .addTag('Product', 'Product catalog')
    .addTag('Order', 'Order management')
    .addTag('Media', 'File upload & download')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ============================================================================
  // 6. START SERVER
  // ============================================================================
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);

  // Get logger instance untuk logging
  const logger = app.get(Logger);
  logger.log(`🚀 WhatsApp Assistant server running on http://${host}:${port}`);
  logger.log(`📚 Swagger documentation available at http://${host}:${port}/api/docs`);
  logger.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
}

// ============================================================================
// 7. BOOTSTRAP APPLICATION
// ============================================================================
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
