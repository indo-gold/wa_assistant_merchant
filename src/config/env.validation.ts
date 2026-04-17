/**
 * ============================================================================
 * ENVIRONMENT VALIDATION - Zod Schema
 * ============================================================================
 *
 * File ini berisi schema validasi untuk environment variables menggunakan Zod.
 * Validasi dilakukan saat aplikasi start untuk memastikan semua config
 * yang diperlukan tersedia dan valid.
 *
 * Keuntungan:
 * - Type-safe environment variables
 * - Auto-validation saat startup
 * - Clear error messages jika ada config yang missing
 * - Auto-casting types (number, boolean, string)
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { z } from 'zod';

/**
 * ============================================================================
 * ZOD SCHEMA DEFINITION
 * ============================================================================
 * Definisi schema untuk validasi environment variables
 */
export const envSchema = z.object({
  // ============================================================================
  // SERVER CONFIGURATION
  // ============================================================================
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('3000'),
  HOST: z.string().default('0.0.0.0'),
  BASE_URL: z.string().url().default('http://localhost:3000'),
  URL: z.string().url().default('https://stg-whatsapp.chatpintar.com'),

  // ============================================================================
  // SECURITY CONFIGURATION
  // ============================================================================
  SECRET_NAME: z.string().default('WA_ASSISTANT'),
  SECRET_HASHED_KEY: z.string(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  VERIFY_TOKEN: z.string(),
  INTERNAL_SECRET: z.string(),

  // ============================================================================
  // DATABASE CONFIGURATION
  // ============================================================================
  DATABASE: z.string().default('chatbot'),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_USERNAME: z.string().default('root'),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_PORT: z.string().default('3306'),

  // ============================================================================
  // META WHATSAPP API CONFIGURATION
  // ============================================================================
  WHATSAPP_API_URL: z.string().url().default('https://graph.facebook.com/v24.0'),
  ACCESS_TOKEN: z.string(),
  APP_ID: z.string(),
  APP_SECRET: z.string(),
  RECIPIENT_WAID: z.string().default('+6282310362224'),
  VERSION: z.string().default('v22.0'),
  PHONE_NUMBER_ID: z.string(),
  CATALOG_ID: z.string(),
  USER_TOKEN: z.string(),

  // ============================================================================
  // AI PROVIDER CONFIGURATION - OpenAI
  // ============================================================================
  OPENAI_API_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_API_KEY: z.string(),
  OPENAI_ADMIN_API_KEY: z.string().optional(),
  OPENAI_ASSISTANT_ID: z.string().optional(),

  // ============================================================================
  // AI PROVIDER CONFIGURATION - Bailian (Alibaba)
  // ============================================================================
  BAILIAN_API_URL: z.string().url().optional(),
  BAILIAN_API_KEY: z.string().optional(),

  // ============================================================================
  // AI PROVIDER CONFIGURATION - Deepseek
  // ============================================================================
  DEEPSEEK_API_URL: z.string().url().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),

  // ============================================================================
  // AI PROVIDER CONFIGURATION - OpenRouter
  // ============================================================================
  OPENROUTER_API_URL: z.string().url().optional(),
  OPENROUTER_API_KEY: z.string().optional(),

  // ============================================================================
  // AI PROVIDER CONFIGURATION - xAI Grok
  // ============================================================================
  GROK_API_URL: z.string().url().optional(),
  GROK_API_KEY: z.string().optional(),

  // ============================================================================
  // AI PROVIDER CONFIGURATION - Groq
  // ============================================================================
  GROQ_API_URL: z.string().url().optional(),
  GROQ_API_KEY: z.string().optional(),

  // ============================================================================
  // AI PROVIDER CONFIGURATION - Cerebras
  // ============================================================================
  CEREBRAS_API_URL: z.string().url().optional(),
  CEREBRAS_API_KEY: z.string().optional(),

  // ============================================================================
  // EXTERNAL INTEGRATIONS
  // ============================================================================
  SEND_HOOK: z.string().url().default('http://localhost:3001'),
  CORS_ORIGINS: z.string().default('http://localhost:3001'),
  GOOGLE_SHEET_URL: z.string().url().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  // ============================================================================
  // XENDIT PAYMENT CONFIGURATION
  // ============================================================================
  XENDIT_API_KEY: z.string().optional(),
  XENDIT_API_URL: z.string().url().optional().default('https://api.xendit.co'),
  XENDIT_SUB_ACCOUNT_ID: z.string().optional(),
  XENDIT_WEBHOOK_TOKEN: z.string().optional(),
});

/**
 * ============================================================================
 * TYPE DEFINITION
 * ============================================================================
 * TypeScript type yang di-generate dari Zod schema
 * untuk type-safe environment variables
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * ============================================================================
 * VALIDATION FUNCTION
 * ============================================================================
 * Fungsi untuk validasi environment variables
 * @param config - Object berisi environment variables
 * @returns Validated config dengan proper types
 * @throws Error jika validasi gagal
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    // Format error messages untuk lebih readable
    const errors = parsed.error.errors.map((error) => {
      return `  ❌ ${error.path.join('.')}: ${error.message}`;
    });

    throw new Error(
      `\n========================================\n` +
        `  ENVIRONMENT VALIDATION FAILED\n` +
        `========================================\n` +
        `${errors.join('\n')}\n` +
        `========================================\n` +
        `  Please check your .env file\n` +
        `========================================`,
    );
  }

  return parsed.data;
}

/**
 * ============================================================================
 * CONFIG HELPER
 * ============================================================================
 * Helper untuk mengambil config dengan default value
 */
export function getEnvValue<T extends keyof EnvConfig>(
  key: T,
  defaultValue?: EnvConfig[T],
): EnvConfig[T] {
  const value = process.env[key] as EnvConfig[T] | undefined;
  return value ?? defaultValue!;
}
