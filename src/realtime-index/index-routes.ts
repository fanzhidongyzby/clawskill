/**
 * 实时数据索引 API 路由
 *
 * 端点：
 * - POST /api/v1/webhook/github - GitHub Webhook 接收
 * - GET /api/v1/index/status - 获取索引状态
 * - GET /api/v1/index/jobs/:jobId - 获取任务状态
 * - POST /api/v1/index/rebuild - 手动触发重建索引
 * - GET /api/v1/cache/stats - 缓存统计
 * - DELETE /api/v1/cache/:skillId - 清除缓存
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RealtimeIndexService, realtimeIndexService, GitHubWebhookPayload } from './index-service';

interface WebhookHeaders {
  'x-github-event': string;
  'x-github-delivery': string;
  'x-hub-signature-256'?: string;
}

interface WebhookBody {
  [key: string]: unknown;
}

interface RebuildBody {
  skillId: string;
  repository: string;
}

/**
 * 注册实时数据索引路由
 */
export async function registerRealtimeIndexRoutes(
  fastify: FastifyInstance,
  options: { prefix: string }
): Promise<void> {

  /**
   * GitHub Webhook 接收
   * POST /api/v1/webhook/github
   */
  fastify.post<{
    Headers: WebhookHeaders;
    Body: WebhookBody;
  }>(
    '/webhook/github',
    async (
      request: FastifyRequest<{
        Headers: WebhookHeaders;
        Body: WebhookBody;
      }>,
      reply: FastifyReply
    ) => {
      const event = request.headers['x-github-event'];
      const delivery = request.headers['x-github-delivery'];

      if (!event) {
        return reply.status(400).send({
          code: 400,
          message: 'Missing x-github-event header',
        });
      }

      // 验证签名（如果配置了 secret）
      // const signature = request.headers['x-hub-signature-256'];
      // if (signature && !verifySignature(request.body, signature)) {
      //   return reply.status(401).send({ code: 401, message: 'Invalid signature' });
      // }

      try {
        const payload = request.body as GitHubWebhookPayload;
        const result = await realtimeIndexService.handleWebhook(event, payload);

        if (result.accepted) {
          return reply.status(202).send({
            code: 0,
            message: 'Webhook accepted',
            data: {
              jobId: result.jobId,
              event,
              delivery,
            },
          });
        } else {
          return reply.status(400).send({
            code: 400,
            message: result.message || 'Webhook rejected',
          });
        }
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          code: 500,
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 获取索引状态
   * GET /api/v1/index/status
   */
  fastify.get(
    '/index/status',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const status = realtimeIndexService.getQueueStatus();

        return reply.send({
          code: 0,
          message: 'success',
          data: {
            queue: status,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          code: 500,
          message: 'Internal server error',
        });
      }
    }
  );

  /**
   * 手动触发重建索引
   * POST /api/v1/index/rebuild
   */
  fastify.post<{
    Body: RebuildBody;
  }>(
    '/index/rebuild',
    async (
      request: FastifyRequest<{ Body: RebuildBody }>,
      reply: FastifyReply
    ) => {
      const { skillId, repository } = request.body;

      if (!skillId || !repository) {
        return reply.status(400).send({
          code: 400,
          message: 'skillId and repository are required',
        });
      }

      try {
        const job = {
          id: `rebuild-${Date.now()}`,
          type: 'skill-update' as const,
          skillId,
          repository,
          timestamp: new Date(),
          priority: 'normal' as const,
          payload: {
            repository: {
              full_name: repository,
              html_url: `https://github.com/${repository}`,
              name: repository.split('/')[1],
              owner: { login: repository.split('/')[0] },
            },
            sender: { login: 'manual-trigger' },
          },
        };

        const result = await realtimeIndexService.processJob(job);

        return reply.send({
          code: 0,
          message: 'Index rebuild completed',
          data: result,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          code: 500,
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 获取缓存统计
   * GET /api/v1/cache/stats
   */
  fastify.get(
    '/cache/stats',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const cacheManager = realtimeIndexService.getCacheManager();

        // 对于内存缓存，返回基本信息
        if (cacheManager instanceof (await import('./index-service')).InMemoryCacheManager) {
          // 获取缓存大小
          const stats = {
            type: 'in-memory',
            message: 'Cache statistics available for Redis-backed implementation',
            timestamp: new Date().toISOString(),
          };

          return reply.send({
            code: 0,
            message: 'success',
            data: stats,
          });
        }

        return reply.send({
          code: 0,
          message: 'success',
          data: {
            type: 'custom',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          code: 500,
          message: 'Internal server error',
        });
      }
    }
  );

  /**
   * 清除技能缓存
   * DELETE /api/v1/cache/:skillId
   */
  fastify.delete<{
    Params: { skillId: string };
  }>(
    '/cache/:skillId',
    async (
      request: FastifyRequest<{ Params: { skillId: string } }>,
      reply: FastifyReply
    ) => {
      const { skillId } = request.params;

      try {
        const cacheManager = realtimeIndexService.getCacheManager();
        await cacheManager.invalidate(skillId);

        return reply.send({
          code: 0,
          message: 'Cache invalidated',
          data: {
            skillId,
            invalidatedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          code: 500,
          message: 'Internal server error',
        });
      }
    }
  );

  /**
   * 批量清除缓存
   * DELETE /api/v1/cache/batch
   */
  fastify.delete<{
    Body: { skillIds: string[] };
  }>(
    '/cache/batch',
    async (
      request: FastifyRequest<{ Body: { skillIds: string[] } }>,
      reply: FastifyReply
    ) => {
      const { skillIds } = request.body;

      if (!Array.isArray(skillIds) || skillIds.length === 0) {
        return reply.status(400).send({
          code: 400,
          message: 'skillIds array is required',
        });
      }

      try {
        const cacheManager = realtimeIndexService.getCacheManager();

        for (const skillId of skillIds) {
          await cacheManager.invalidate(skillId);
        }

        return reply.send({
          code: 0,
          message: 'Batch cache invalidation completed',
          data: {
            count: skillIds.length,
            invalidatedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          code: 500,
          message: 'Internal server error',
        });
      }
    }
  );
}