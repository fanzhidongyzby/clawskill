/**
 * 星级评分路由
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ratingService } from '../core/rating';

interface RatingParams {
  skillId: string;
}

interface CreateRatingBody {
  skillId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
}

interface UpdateRatingBody {
  rating?: number;
  comment?: string;
}

export async function ratingRoutes(fastify: FastifyInstance) {
  /**
   * 获取技能评分
   * GET /api/v1/skills/:skillId/ratings
   */
  fastify.get<{
    Params: RatingParams;
    Querystring: { limit?: string; offset?: string; sort?: 'recent' | 'helpful' };
  }>(
    '/skills/:skillId/ratings',
    async (
      request: FastifyRequest<{
        Params: RatingParams;
        Querystring: { limit?: string; offset?: string; sort?: 'recent' | 'helpful' };
      }>,
      reply: FastifyReply
    ) => {
      const { skillId } = request.params;
      const { limit, offset, sort } = request.query;

      try {
        const ratings = await ratingService.getRatings(skillId, {
          limit: limit ? parseInt(limit, 10) : 20,
          offset: offset ? parseInt(offset, 10) : 0,
          sort: sort || 'recent',
        });

        return reply.send({
          code: 0,
          message: 'success',
          data: ratings,
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
   * 获取技能评分摘要
   * GET /api/v1/skills/:skillId/ratings/summary
   */
  fastify.get<{ Params: RatingParams }>(
    '/skills/:skillId/ratings/summary',
    async (
      request: FastifyRequest<{ Params: RatingParams }>,
      reply: FastifyReply
    ) => {
      const { skillId } = request.params;

      try {
        const summary = await ratingService.getRatingSummary(skillId);

        return reply.send({
          code: 0,
          message: 'success',
          data: summary,
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
   * 获取技能评分统计
   * GET /api/v1/skills/:skillId/ratings/stats
   */
  fastify.get<{ Params: RatingParams }>(
    '/skills/:skillId/ratings/stats',
    async (
      request: FastifyRequest<{ Params: RatingParams }>,
      reply: FastifyReply
    ) => {
      const { skillId } = request.params;

      try {
        const stats = await ratingService.getRatingStats(skillId);

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
   * 创建评分（需认证）
   * POST /api/v1/skills/:skillId/ratings
   */
  fastify.post<{ Params: RatingParams; Body: CreateRatingBody }>(
    '/skills/:skillId/ratings',
    async (
      request: FastifyRequest<{ Params: RatingParams; Body: CreateRatingBody }>,
      reply: FastifyReply
    ) => {
      const { skillId } = request.params;
      const { userId, rating, comment } = request.body;

      if (!userId) {
        return reply.status(401).send({
          code: 401,
          message: 'Unauthorized',
        });
      }

      try {
        // 检查是否已评分
        const hasRated = await ratingService.hasRated(skillId, userId);
        if (hasRated) {
          return reply.status(400).send({
            code: 400,
            message: 'User has already rated this skill',
          });
        }

        const newRating = await ratingService.createRating({
          skillId,
          userId,
          rating,
          comment,
        });

        return reply.send({
          code: 0,
          message: 'success',
          data: newRating,
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
   * 更新评分（需认证）
   * PUT /api/v1/skills/:skillId/ratings/:ratingId
   */
  fastify.put<{
    Params: { skillId: string; ratingId: string };
    Body: UpdateRatingBody;
  }>(
    '/skills/:skillId/ratings/:ratingId',
    async (
      request: FastifyRequest<{
        Params: { skillId: string; ratingId: string };
        Body: UpdateRatingBody;
      }>,
      reply: FastifyReply
    ) => {
      const { skillId, ratingId } = request.params;
      const { rating, comment } = request.body;

      try {
        const updatedRating = await ratingService.updateRating(ratingId, {
          rating,
          comment,
        });

        return reply.send({
          code: 0,
          message: 'success',
          data: updatedRating,
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
   * 删除评分（需认证）
   * DELETE /api/v1/skills/:skillId/ratings/:ratingId
   */
  fastify.delete<{ Params: { skillId: string; ratingId: string } }>(
    '/skills/:skillId/ratings/:ratingId',
    async (
      request: FastifyRequest<{ Params: { skillId: string; ratingId: string } }>,
      reply: FastifyReply
    ) => {
      const { skillId, ratingId } = request.params;

      try {
        await ratingService.deleteRating(ratingId);

        return reply.send({
          code: 0,
          message: 'success',
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
   * 获取用户的评分
   * GET /api/v1/users/:userId/ratings
   */
  fastify.get<{ Params: { userId: string }; Querystring: { limit?: string; offset?: string } }>(
    '/users/:userId/ratings',
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
        const ratings = await ratingService.getUserRatings(userId, {
          limit: limit ? parseInt(limit, 10) : 20,
          offset: offset ? parseInt(offset, 10) : 0,
        });

        return reply.send({
          code: 0,
          message: 'success',
          data: ratings,
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