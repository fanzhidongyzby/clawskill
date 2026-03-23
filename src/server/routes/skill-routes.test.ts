import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../index';
import type { FastifyInstance } from 'fastify';

describe('Skill API Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer({ logger: false, skipAuth: true, inMemory: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('returns health status', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe('ok');
      expect(body.version).toBeDefined();
    });
  });

  describe('GET /api/v1/skills', () => {
    it('returns empty list initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/skills' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });
  });

  describe('POST /api/v1/skills', () => {
    it('creates a skill', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/skills',
        payload: {
          name: 'weather',
          namespace: 'openclaw',
          description: 'Weather forecasting',
          author: 'dev',
          license: 'MIT',
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBe('openclaw/weather');
      expect(body.name).toBe('weather');
    });
  });

  describe('GET /api/v1/skills/:namespace/:name', () => {
    it('gets a skill', async () => {
      // Create first
      await app.inject({
        method: 'POST',
        url: '/api/v1/skills',
        payload: {
          name: 'test-get',
          namespace: 'openclaw',
          description: 'Test',
          author: 'dev',
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/skills/openclaw/test-get',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().name).toBe('test-get');
    });

    it('returns 404 for missing skill', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/skills/nonexistent/skill',
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/v1/skills/:namespace/:name', () => {
    it('deletes a skill', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/skills',
        payload: {
          name: 'to-delete',
          namespace: 'openclaw',
          description: 'Delete me',
          author: 'dev',
        },
      });

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/skills/openclaw/to-delete',
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for missing skill', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/skills/nonexistent/skill',
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/skills/:namespace/:name/versions', () => {
    it('returns empty versions list', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/skills',
        payload: {
          name: 'versioned',
          namespace: 'openclaw',
          description: 'Versioned skill',
          author: 'dev',
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/skills/openclaw/versioned/versions',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });
  });

  describe('POST /api/v1/skills/:namespace/:name/versions', () => {
    it('publishes a version', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/skills',
        payload: {
          name: 'pub-test',
          namespace: 'openclaw',
          description: 'Publish test',
          author: 'dev',
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/skills/openclaw/pub-test/versions',
        payload: {
          version: '1.0.0',
          description: 'First release',
          changelog: 'Initial version',
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().version).toBe('1.0.0');
    });
  });

  describe('GET /skill/:namespace/:name', () => {
    it('returns skill for AI agents', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/skills',
        payload: {
          name: 'agent-skill',
          namespace: 'openclaw',
          description: 'For agents',
          author: 'dev',
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/skill/openclaw/agent-skill',
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 for missing skill', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/skill/nonexistent/skill',
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
