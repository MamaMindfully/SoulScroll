import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.string().optional(),
  DEV: z.string().optional(),
  PROD: z.string().optional(),
  MODE: z.enum(["development", "production", "test"]).optional(),
  REACT_APP_ADMIN_TOKEN: z.string(),
  REACT_APP_SUPER_ADMIN_TOKEN: z.string(),
  ADMIN_USER_ID: z.string(),
  JWT_SECRET: z.string().min(12),
  FIELD_ENCRYPTION_KEY: z.string().min(32),
  OPENAI_API_KEY: z.string().min(20),
  OPENAI_API_KEY_ENV_VAR: z.string().optional(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_PRICE_ID: z.string(),
  STRIPE_PRICE_ID_MONTHLY: z.string(),
  STRIPE_PRICE_ID_YEARLY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  REDIS_URL: z.string().url(),
  VAPID_PUBLIC_KEY: z.string(),
  VAPID_PRIVATE_KEY: z.string(),
  VITE_SENTRY_DSN: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
});

export const env = EnvSchema.parse(process.env);
