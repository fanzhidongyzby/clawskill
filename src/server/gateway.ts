/**
 * API Gateway - 统一网关入口
 * 集成各个服务的 API，统一路由和认证
 */
import Fastify, { FastifyInstance } from 'fastify';
import { registerSkillRoutes } from '../routes/skill-routes';
import { registerGitHubRoutes } from './routes/github-routes';
import { registerSearchRoutes } from './routes/search-routes';
import { registerSecurityRoutes } from './routes/security-routes';
import { authMiddleware } from './middleware/auth';

/**
 * API Gateway 配置
 */
export interface GatewayConfig {
  port?: number;
  host?: string;
  logger?: boolean;
}

/**
 * 创建 API Gateway
 */
export async function createGateway(config: GatewayConfig = {}): Promise<FastifyInstance> {
  const gateway = Fastify({
    logger: config.logger ?? false,
  });

  // 注册 CORS
  await gateway.register(require('@fastify/cors'), {
    origin: true,
    credentials: true,
  });

  // 注册认证中间件
  gateway.addHook('onRequest', authMiddleware);

  // 健康检查
  gateway.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      registry: 'ok',
      search: 'ok',
      security: 'ok',
    },
  }));

  // API 版本前缀
  await gateway.register(async (fastify) => {
    // v1 API
    await fastify.register(async (v1) => {
      // 技能相关 API
      await registerSkillRoutes(v1, { skillService: null as any }); // TODO: 注入实际 service

      // GitHub 集成 API
      await registerGitHubRoutes(v1);

      // 搜索 API
      await registerSearchRoutes(v1);

      // 安全扫描 API
      await registerSecurityRoutes(v1);
    }, { prefix: '/api/v1' });
  });

  // Swagger 文档
  await gateway.register(require('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'ClawSkill API',
        description: 'AI Agent Skill Package Manager API',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:8080',
          description: 'Development server',
        },
      ],
    },
  });

  await gateway.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
  });

  return gateway;
}

/**
 * 启动 API Gateway
 */
export async function startGateway(config: GatewayConfig = {}): Promise<void> {
  const gateway = await createGateway(config);

  const port = config.port ?? 8080;
  const host = config.host ?? '0.0.0.0';

  await gateway.listen({ port, host });

  console.log(`\n🚀 ClawSkill API Gateway running at http://${host}:${port}`);
  console.log(`📚 API Docs at http://${host}:${port}/docs`);
  console.log(`🔗 Health check at http://${host}:${port}/health\n`);
}