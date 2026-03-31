/**
 * Quality Score API 路由
 *
 * 端点：
 * - GET /api/v1/skills/:id/quality - 获取技能质量评分
 * - POST /api/v1/quality/evaluate - 触发质量评估
 * - GET /api/v1/quality/stats - 获取评分统计
 * - POST /api/v1/skills/quality/batch - 批量获取质量评分
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { qualityScoreService, QualityScoreResult } from './quality-score';
import { SkillService } from '../core/skill-service';
import type { Skill } from '../types/skill';

interface QualityParams {
  id: string;
}

interface EvaluateBody {
  skillId: string;
  forceRefresh?: boolean; // 强制刷新缓存
}

interface BatchBody {
  skillIds: string[];
}

interface QualityQuerystring {
  refresh?: 'true' | 'false'; // 是否强制刷新
  dimensions?: 'true' | 'false'; // 是否返回详细维度
}

/**
 * 注册质量评分路由
 */
export async function registerQualityRoutes(
  fastify: FastifyInstance,
  options: { prefix: string; skillService: SkillService }
): Promise<void> {
  const { skillService } = options;

  /**
   * 获取技能质量评分
   * GET /api/v1/skills/:id/quality
   */
  fastify.get<{
    Params: QualityParams;
    Querystring: QualityQuerystring;
  }>(
    '/skills/:id/quality',
    async (
      request: FastifyRequest<{
        Params: QualityParams;
        Querystring: QualityQuerystring;
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { refresh, dimensions } = request.query;

      try {
        // 获取技能详情
        const skill = await skillService.get(id);

        // 检查是否需要刷新缓存
        if (refresh === 'true') {
          qualityScoreService.clearCache(id);
        }

        // 计算质量评分
        const result = await qualityScoreService.calculateQualityScore(skill);

        // 根据请求返回不同格式
        const response = dimensions === 'true'
          ? result
          : {
              skillId: result.skillId,
              score: result.score,
              score100: result.score100,
              grade: result.grade,
              recommendation: result.recommendation,
              scannedAt: result.scannedAt,
            };

        return reply.send({
          code: 0,
          message: 'success',
          data: response,
        });
      } catch (error) {
        fastify.log.error(error);
        
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            code: 404,
            message: 'Skill not found',
          });
        }

        return reply.status(500).send({
          code: 500,
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 批量获取质量评分
   * POST /api/v1/skills/quality/batch
   */
  fastify.post<{
    Body: BatchBody;
  }>(
    '/skills/quality/batch',
    async (
      request: FastifyRequest<{ Body: BatchBody }>,
      reply: FastifyReply
    ) => {
      const { skillIds } = request.body;

      if (!Array.isArray(skillIds) || skillIds.length === 0) {
        return reply.status(400).send({
          code: 400,
          message: 'Invalid skillIds',
        });
      }

      // 限制批量请求数量
      if (skillIds.length > 50) {
        return reply.status(400).send({
          code: 400,
          message: 'Maximum 50 skills per batch request',
        });
      }

      try {
        // 批量获取技能
        const skills: Skill[] = [];
        for (const id of skillIds) {
          try {
            const skill = await skillService.get(id);
            skills.push(skill as Skill);
          } catch {
            // 忽略找不到的技能
          }
        }

        // 批量计算评分
        const results = await qualityScoreService.calculateBatch(skills);

        return reply.send({
          code: 0,
          message: 'success',
          data: results.map(r => ({
            skillId: r.skillId,
            score: r.score,
            score100: r.score100,
            grade: r.grade,
            recommendation: r.recommendation,
          })),
          meta: {
            total: results.length,
            requested: skillIds.length,
            missing: skillIds.length - results.length,
          },
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
   * 触发质量评估
   * POST /api/v1/quality/evaluate
   */
  fastify.post<{
    Body: EvaluateBody;
  }>(
    '/quality/evaluate',
    async (
      request: FastifyRequest<{ Body: EvaluateBody }>,
      reply: FastifyReply
    ) => {
      const { skillId, forceRefresh } = request.body;

      if (!skillId) {
        return reply.status(400).send({
          code: 400,
          message: 'skillId is required',
        });
      }

      try {
        // 获取技能
        const skill = await skillService.get(skillId);

        // 强制刷新缓存
        if (forceRefresh) {
          qualityScoreService.clearCache(skillId);
        }

        // 计算评分
        const result = await qualityScoreService.calculateQualityScore(skill);

        return reply.send({
          code: 0,
          message: forceRefresh ? 'Quality score recalculated' : 'Quality score calculated',
          data: result,
        });
      } catch (error) {
        fastify.log.error(error);
        
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            code: 404,
            message: 'Skill not found',
          });
        }

        return reply.status(500).send({
          code: 500,
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 获取评分等级分布统计
   * GET /api/v1/quality/stats
   */
  fastify.get<{
    Querystring: { category?: string };
  }>(
    '/quality/stats',
    async (
      request: FastifyRequest<{ Querystring: { category?: string } }>,
      reply: FastifyReply
    ) => {
      const { category } = request.query;

      try {
        // 获取技能列表
        const skillsResult = await skillService.list({
          page: 1,
          pageSize: 1000,
          category: category,
          sort: 'downloads',
          order: 'desc',
        });

        // 计算所有技能的评分
        const results = await qualityScoreService.calculateBatch(skillsResult.data);

        // 统计各等级分布
        const gradeDistribution = {
          A: 0,
          B: 0,
          C: 0,
          D: 0,
          F: 0,
        };

        const recommendationDistribution = {
          recommended: 0,
          good: 0,
          acceptable: 0,
          caution: 0,
          avoid: 0,
        };

        let totalScore = 0;
        let maxScore = 0;
        let minScore = 1;

        for (const r of results) {
          gradeDistribution[r.grade]++;
          recommendationDistribution[r.recommendation]++;
          totalScore += r.score;
          maxScore = Math.max(maxScore, r.score);
          minScore = Math.min(minScore, r.score);
        }

        return reply.send({
          code: 0,
          message: 'success',
          data: {
            gradeDistribution,
            recommendationDistribution,
            averageScore: results.length > 0 ? totalScore / results.length : 0,
            maxScore,
            minScore,
            totalSkills: results.length,
          },
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
   * 按评分筛选技能
   * GET /api/v1/quality/filter
   */
  fastify.get<{
    Querystring: {
      minGrade?: 'A' | 'B' | 'C' | 'D' | 'F';
      minScore?: string;
      maxScore?: string;
      recommendation?: 'recommended' | 'good' | 'acceptable' | 'caution' | 'avoid';
      limit?: string;
    };
  }>(
    '/quality/filter',
    async (
      request: FastifyRequest<{
        Querystring: {
          minGrade?: 'A' | 'B' | 'C' | 'D' | 'F';
          minScore?: string;
          maxScore?: string;
          recommendation?: 'recommended' | 'good' | 'acceptable' | 'caution' | 'avoid';
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { minGrade, minScore, maxScore, recommendation, limit } = request.query;

      try {
        // 获取技能列表
        const skillsResult = await skillService.list({
          page: 1,
          pageSize: 500,
          sort: 'downloads',
          order: 'desc',
        });

        // 计算评分
        const results = await qualityScoreService.calculateBatch(skillsResult.data);

        // 过滤
        let filtered = results;

        if (minGrade) {
          const gradeOrder = ['A', 'B', 'C', 'D', 'F'];
          const minIndex = gradeOrder.indexOf(minGrade);
          filtered = filtered.filter(r => gradeOrder.indexOf(r.grade) <= minIndex);
        }

        if (minScore) {
          const min = parseFloat(minScore);
          filtered = filtered.filter(r => r.score >= min);
        }

        if (maxScore) {
          const max = parseFloat(maxScore);
          filtered = filtered.filter(r => r.score <= max);
        }

        if (recommendation) {
          filtered = filtered.filter(r => r.recommendation === recommendation);
        }

        // 排序（按评分降序）
        filtered.sort((a, b) => b.score - a.score);

        // 限制数量
        const limitNum = limit ? parseInt(limit, 10) : 20;
        filtered = filtered.slice(0, limitNum);

        return reply.send({
          code: 0,
          message: 'success',
          data: filtered.map(r => ({
            skillId: r.skillId,
            score: r.score,
            score100: r.score100,
            grade: r.grade,
            recommendation: r.recommendation,
          })),
          meta: {
            total: filtered.length,
            filteredFrom: results.length,
          },
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