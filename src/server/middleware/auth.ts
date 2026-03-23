/**
 * API Key authentication middleware
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { getDb } from '../../core/db';

// Skip auth for these paths
const PUBLIC_PATHS = [
  '/health',
  '/docs',
  '/skill/',
];

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Skip public paths
  if (PUBLIC_PATHS.some(p => request.url.startsWith(p))) {
    return;
  }

  // GET requests to /api/v1/skills are public (read-only)
  if (request.method === 'GET' && request.url.startsWith('/api/v1/skills')) {
    return;
  }

  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing API key' });
    return;
  }

  const key = auth.slice(7);
  const validKey = await validateApiKey(key);

  if (!validKey) {
    reply.code(401).send({ error: 'Invalid API key' });
    return;
  }

  // Attach key info to request
  request.apiKey = validKey;
}

async function validateApiKey(key: string): Promise<{ id: number; name: string; scopes: string[] } | null> {
  const db = getDb();

  const row = await db
    .selectFrom('api_keys')
    .selectAll()
    .where('key', '=', key)
    .executeTakeFirst();

  if (!row) return null;

  // Check expiration
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return null;
  }

  // Update last_used_at
  await db
    .updateTable('api_keys')
    .set({ last_used_at: new Date() })
    .where('id', '=', row.id)
    .execute();

  return {
    id: row.id,
    name: row.name,
    scopes: row.scopes ?? [],
  };
}

// Extend FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: { id: number; name: string; scopes: string[] };
  }
}

// Helper to generate API keys
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'cs_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Create an API key (for CLI use)
export async function createApiKey(name: string, scopes: string[] = ['read', 'write']): Promise<string> {
  const db = getDb();
  const key = generateApiKey();

  await db
    .insertInto('api_keys')
    .values({
      key,
      name,
      scopes,
    })
    .execute();

  return key;
}