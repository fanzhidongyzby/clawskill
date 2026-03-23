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
import { registerSkillRoutes } from './routes/skill-routes';
import { config } from './config';

export interface ServerOptions {
  port?: number;
  host?: string;
  logger?: boolean;
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

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
  }));

  // Register API routes
  const skillService = new SkillService();
  await fastify.register(registerSkillRoutes, { prefix: '/api/v1', skillService });

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