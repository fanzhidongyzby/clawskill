/**
 * 安全评分路由
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { securityScoreService, SecurityScoreResult } from '../core/security-score';

interface SecurityScoreParams {
  skillId: string;
}

export async function securityScoreRoutes(fastify: FastifyInstance) {
  /**
   * 获取技能安全评分
   * GET /api/v1/skills/:skillId/security-score
   */
  fastify.get<{ Params: SecurityScoreParams }>(
    '/skills/:skillId/security-score',
    async (request: FastifyRequest<{ Params: SecurityScoreParams }>, reply: FastifyReply) => {
      const { skillId } = request.params;

      try {
        // 计算安全评分
        const result: SecurityScoreResult = await securityScoreService.calculateSecurityScore(
          skillId
        );

        return reply.send({
          code: 0,
          message: 'success',
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
   * 批量获取安全评分
   * POST /api/v1/skills/security-scores/batch
   */
  fastify.post<{ Body: { skillIds: string[] } }>(
    '/skills/security-scores/batch',
    async (
      request: FastifyRequest<{ Body: { skillIds: string[] } }>,
      reply: FastifyReply
    ) => {
      const { skillIds } = request.body;

      if (!Array.isArray(skillIds) || skillIds.length === 0) {
        return reply.status(400).send({
          code: 400,
          message: 'Invalid skillIds',
        });
      }

      try {
        // 批量计算安全评分
        const results = await Promise.all(
          skillIds.map(async (skillId) => {
            const result = await securityScoreService.calculateSecurityScore(skillId);
            return { skillId, ...result };
          })
        );

        return reply.send({
          code: 0,
          message: 'success',
          data: results,
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