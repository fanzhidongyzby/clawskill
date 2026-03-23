/**
 * Kysely database connection
 */

import { Kysely, PostgresDialect } from 'kysely';
import type { Database } from './db-types';
import pg from 'pg';

const { Pool } = pg;

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  max?: number;
}

export function createDb(config: DbConfig): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        max: config.max ?? 10,
      }),
    }),
  });
}

// Singleton for app-wide use
let db: Kysely<Database> | null = null;

export function getDb(): Kysely<Database> {
  if (!db) {
    const config: DbConfig = {
      host: process.env.CLAWSKILL_DB_HOST ?? process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.CLAWSKILL_DB_PORT ?? process.env.DB_PORT ?? '5432', 10),
      user: process.env.CLAWSKILL_DB_USER ?? process.env.DB_USER ?? 'clawskill',
      password: process.env.CLAWSKILL_DB_PASSWORD ?? process.env.DB_PASSWORD ?? 'clawskill',
      database: process.env.CLAWSKILL_DB_NAME ?? process.env.DB_NAME ?? 'clawskill',
    };
    db = createDb(config);
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
  }
}
