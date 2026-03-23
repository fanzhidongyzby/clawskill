/**
 * Server configuration
 */

import { z } from 'zod';

const configSchema = z.object({
  port: z.number().default(8080),
  host: z.string().default('0.0.0.0'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  corsOrigins: z.array(z.string()).default(['*']),
  rateLimitMax: z.number().default(60),
  database: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(5432),
    user: z.string().default('clawskill'),
    password: z.string().default('clawskill'),
    database: z.string().default('clawskill'),
  }).default({}),
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
  }).default({}),
});

type Config = z.infer<typeof configSchema> & {
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
};

function loadConfig(): Config {
  const rawConfig = configSchema.parse({
    port: parseInt(process.env.PORT ?? '8080', 10),
    host: process.env.HOST ?? '0.0.0.0',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    logLevel: process.env.LOG_LEVEL ?? 'info',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['*'],
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '60', 10),
    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      user: process.env.DB_USER ?? 'clawskill',
      password: process.env.DB_PASSWORD ?? 'clawskill',
      database: process.env.DB_NAME ?? 'clawskill',
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    },
  });

  return {
    ...rawConfig,
    isDev: rawConfig.nodeEnv === 'development',
    isProd: rawConfig.nodeEnv === 'production',
    isTest: rawConfig.nodeEnv === 'test',
  };
}

export const config = loadConfig();