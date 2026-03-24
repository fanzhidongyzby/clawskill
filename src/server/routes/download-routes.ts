/**
 * 下载统计路由
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { downloadStatsService } from '../core/download-stats';

interface DownloadStatsParams {
  skillId: string;
}

interface RecordDownloadBody {
  skillId: string;
  version: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function downloadStatsRoutes(fastify: FastifyInstance) {
  /**
   * 获取技能下载统计
   * GET /api/v1/skills/:skillId/downloads
   */
  fastify.get<{ Params: DownloadStatsParams }>(
    '/skills/:skillId/downloads',
    async (
      request: FastifyRequest<{ Params: DownloadStatsParams }>,
      reply: FastifyReply
    ) => {
      const { skillId } = request.params;

      try {
        const stats = await downloadStatsService.getDownloadStats(skillId);

        return reply.send({
          code: 0,
          message: 'success',
          data: stats,
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
   * 获取热门技能
   * GET /api/v1/skills/trending
   */
  fastify.get<{ Querystring: { period?: '7d' | '30d' | '90d'; limit?: string; category?: string } }>(
    '/skills/trending',
    async (
      request: FastifyRequest<{
        Querystring: { period?: '7d' | '30d' | '90d'; limit?: string; category?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { period = '7d', limit, category } = request.query;

      try {
        const trending = await downloadStatsService.getTrendingSkills({
          period,
          limit: limit ? parseInt(limit, 10) : 10,
          category,
        });

        return reply.send({
          code: 0,
          message: 'success',
          data: trending,
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
   * 记录下载（内部 API，需认证）
   * POST /api/v1/downloads/record
   */
  fastify.post<{ Body: RecordDownloadBody }>(
    '/downloads/record',
    async (
      request: FastifyRequest<{ Body: RecordDownloadBody }>,
      reply: FastifyReply
    ) => {
      const { skillId, version, userId, ipAddress, userAgent } = request.body;

      if (!skillId || !version) {
        return reply.status(400).send({
          code: 400,
          message: 'skillId and version are required',
        });
      }

      try {
        const record = await downloadStatsService.recordDownload({
          skillId,
          version,
          userId,
          ipAddress,
          userAgent,
        });

        return reply.send({
          code: 0,
          message: 'success',
          data: record,
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
   * 获取用户下载历史（需认证）
   * GET /api/v1/users/:userId/downloads
   */
  fastify.get<{ Params: { userId: string }; Querystring: { limit?: string; offset?: string } }>(
    '/users/:userId/downloads',
    async (
      request: FastifyRequest<{
        Params: { userId: string };
        Querystring: { limit?: string; offset?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { userId } = request.params;
      const { limit, offset } = request.query;

      try {
        const downloads = await downloadStatsService.getUserDownloads(userId, {
          limit: limit ? parseInt(limit, 10) : 20,
          offset: offset ? parseInt(offset, 10) : 0,
        });

        return reply.send({
          code: 0,
          message: 'success',
          data: downloads,
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
}