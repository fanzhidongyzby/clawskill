/**
 * Fastify API Server for ClawSkill
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { SkillService } from '../core/skill-service';
import { KyselyRepository } from '../core/kysely-repository';
import { registerSkillRoutes } from './routes/skill-routes';
import { authMiddleware } from './middleware/auth';
import { config } from './config';
import { getStorage } from '../core/storage';

export interface ServerOptions {
  port?: number;
  host?: string;
  logger?: boolean;
  skipAuth?: boolean;
  inMemory?: boolean;
}

export async function createServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const enableLogger = options.logger ?? true;

  const fastify = Fastify({
    logger: enableLogger ? {
      level: config.logLevel,
      transport: config.isDev ? { target: 'pino-pretty' } : undefined,
    } : false,
  });

  // Register plugins
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: config.corsOrigins,
  });
  await fastify.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: '1 minute',
  });

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'ClawSkill API',
        description: 'AI Agent Skill Package Manager API',
        version: '0.1.0',
      },
    },
  });
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Auth middleware (skip in test mode)
  if (!options.skipAuth) {
    fastify.addHook('preHandler', authMiddleware);
  }

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
  }));

  // Register API routes
  const { InMemorySkillRepository } = await import('../core/skill-service');
  const repo = options.inMemory ? new InMemorySkillRepository() : new KyselyRepository();
  const skillService = new SkillService(repo);
  await fastify.register(registerSkillRoutes, { prefix: '/api/v1', skillService });

  // Initialize storage
  const storage = getStorage();
  await storage.init();

  // Skill URL endpoint (for AI agents)
  fastify.get('/skill/:namespace/:name', async (request, reply) => {
    const { namespace, name } = request.params as { namespace: string; name: string };
    const { version } = request.query as { version?: string };
    const skillId = `${namespace}/${name}`;

    try {
      if (version) {
        return await skillService.getVersion(skillId, version);
      }
      return await skillService.get(skillId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.code(404).send({ error: 'Skill not found' });
      }
      throw error;
    }
  });

  // Package download endpoint
  fastify.get('/download/:namespace/:name/:version', async (request, reply) => {
    const { namespace, name, version } = request.params as {
      namespace: string;
      name: string;
      version: string;
    };
    const skillId = `${namespace}/${name}`;

    const pkg = await storage.retrieve(skillId, version);
    if (!pkg) {
      return reply.code(404).send({ error: 'Package not found' });
    }

    return pkg.manifest;
  });

  // Package file endpoint
  fastify.get('/download/:namespace/:name/:version/*', async (request, reply) => {
    const parts = (request.params as string[])[0]?.split('/') ?? [];
    if (parts.length < 4) {
      return reply.code(400).send({ error: 'Invalid path' });
    }

    const namespace = parts[0];
    const name = parts[1];
    const version = parts[2];
    const filePath = parts.slice(3).join('/');
    const skillId = `${namespace}/${name}`;

    const content = await storage.getFile(skillId, version, filePath);
    if (!content) {
      return reply.code(404).send({ error: 'File not found' });
    }

    return reply.type('application/octet-stream').send(content);
  });

  return fastify;
}

export async function startServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const fastify = await createServer(options);
  const port = options.port ?? config.port;
  const host = options.host ?? config.host;

  await fastify.listen({ port, host });

  fastify.log.info(`Server running at http://${host}:${port}`);
  fastify.log.info(`API docs at http://${host}:${port}/docs`);

  return fastify;
}