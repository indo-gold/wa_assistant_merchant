/**
 * ============================================================================
 * APP CONFIGURATION
 * ============================================================================
 *
 * File ini berisi konfigurasi aplikasi yang di-load dari environment variables.
 * Menggunakan @nestjs/config dengan validasi Zod.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { registerAs } from '@nestjs/config';

import { validateEnv } from './env.validation';

/**
 * ============================================================================
 * APP CONFIG REGISTRATION
 * ============================================================================
 * Register app config sebagai namespace 'app'
 */
export const appConfig = registerAs('app', () => {
  // Validasi environment variables
  const env = validateEnv(process.env);

  return {
    // Server config
    nodeEnv: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    host: env.HOST,
    baseUrl: env.BASE_URL,
    url: env.URL,

    // Security config
    secretName: env.SECRET_NAME,
    secretHashedKey: env.SECRET_HASHED_KEY,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    verifyToken: env.VERIFY_TOKEN,
    internalSecret: env.INTERNAL_SECRET,
  };
});

/**
 * ============================================================================
 * DATABASE CONFIG REGISTRATION
 * ============================================================================
 * Register database config sebagai namespace 'database'
 */
export const databaseConfig = registerAs('database', () => {
  const env = validateEnv(process.env);

  return {
    database: env.DATABASE,
    host: env.DATABASE_HOST,
    port: parseInt(env.DATABASE_PORT, 10),
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
  };
});

/**
 * ============================================================================
 * WHATSAPP CONFIG REGISTRATION
 * ============================================================================
 * Register WhatsApp config sebagai namespace 'whatsapp'
 */
export const whatsappConfig = registerAs('whatsapp', () => {
  const env = validateEnv(process.env);

  return {
    // Meta API
    apiUrl: env.WHATSAPP_API_URL,
    accessToken: env.ACCESS_TOKEN,
    appId: env.APP_ID,
    appSecret: env.APP_SECRET,
    recipientWaid: env.RECIPIENT_WAID,
    version: env.VERSION,
    phoneNumberId: env.PHONE_NUMBER_ID,
    catalogId: env.CATALOG_ID,
    userToken: env.USER_TOKEN,
    verifyToken: env.VERIFY_TOKEN,
  };
});

/**
 * ============================================================================
 * AI CONFIG REGISTRATION
 * ============================================================================
 * Register AI providers config sebagai namespace 'ai'
 */
export const aiConfig = registerAs('ai', () => {
  const env = validateEnv(process.env);

  return {
    // OpenAI
    openai: {
      apiUrl: env.OPENAI_API_URL,
      apiKey: env.OPENAI_API_KEY,
      adminApiKey: env.OPENAI_ADMIN_API_KEY,
      assistantId: env.OPENAI_ASSISTANT_ID,
    },
    // Bailian
    bailian: {
      apiUrl: env.BAILIAN_API_URL,
      apiKey: env.BAILIAN_API_KEY,
    },
    // Deepseek
    deepseek: {
      apiUrl: env.DEEPSEEK_API_URL,
      apiKey: env.DEEPSEEK_API_KEY,
    },
    // OpenRouter
    openrouter: {
      apiUrl: env.OPENROUTER_API_URL,
      apiKey: env.OPENROUTER_API_KEY,
    },
    // Grok
    grok: {
      apiUrl: env.GROK_API_URL,
      apiKey: env.GROK_API_KEY,
    },
    // Groq
    groq: {
      apiUrl: env.GROQ_API_URL,
      apiKey: env.GROQ_API_KEY,
    },
    // Cerebras
    cerebras: {
      apiUrl: env.CEREBRAS_API_URL,
      apiKey: env.CEREBRAS_API_KEY,
    },
  };
});

/**
 * ============================================================================
 * EXTERNAL CONFIG REGISTRATION
 * ============================================================================
 * Register external integrations config sebagai namespace 'external'
 */
export const externalConfig = registerAs('external', () => {
  const env = validateEnv(process.env);

  return {
    sendHook: env.SEND_HOOK,
    googleSheetUrl: env.GOOGLE_SHEET_URL,
    googleApplicationCredentials: env.GOOGLE_APPLICATION_CREDENTIALS,
  };
});

/**
 * ============================================================================
 * XENDIT CONFIG REGISTRATION
 * ============================================================================
 * Register Xendit payment config sebagai namespace 'xendit'
 */
export const xenditConfig = registerAs('xendit', () => {
  const env = validateEnv(process.env);

  return {
    apiKey: env.XENDIT_API_KEY,
    apiUrl: env.XENDIT_API_URL || 'https://api.xendit.co',
    subAccountId: env.XENDIT_SUB_ACCOUNT_ID,
    webhookToken: env.XENDIT_WEBHOOK_TOKEN,
  };
});

/**
 * ============================================================================
 * ALL CONFIGS EXPORT
 * ============================================================================
 * Export semua config untuk di-import di AppModule
 */
export const allConfigs = [appConfig, databaseConfig, whatsappConfig, aiConfig, externalConfig, xenditConfig];
