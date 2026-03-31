/**
 * Credits API 路由
 *
 * 端点：
 * - GET /api/v1/credits/distribution - Credits 分配查询
 * - GET /api/v1/credits/skills-usage - 技能使用统计
 * - GET /api/v1/credits/history - 历史流水
 * - GET /api/v1/credits/account - 账户摘要
 * - POST /api/v1/credits/estimate - 估算 Credits 消耗
 * - GET /api/v1/credits/tiers - 订阅等级列表
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreditsCalculator, creditsCalculator, CreditResult, CreditUsageRecord } from './credits-calculator';

interface AccountParams {
  userId: string;
}

interface HistoryQuerystring {
  startDate?: string;  // ISO date string
  endDate?: string;
  skillId?: string;
  limit?: string;
}

interface EstimateBody {
  messageType: string;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  model?: string;
}

interface RecordBody {
  userId: string;
  skillId: string;
  sessionId: string;
  messageType: string;
  promptTokens: number;
  completionTokens: number;
  model?: string;
  metadata?: Record<string, unknown>;
}

interface SkillUsageParams {
  skillId: string;
}

/**
 * 注册 Credits 路由
 */
export async function registerCreditsRoutes(
  fastify: FastifyInstance,
  options: { prefix: string }
): Promise<void> {

  /**
   * 获取账户摘要
   * GET /api/v1/credits/account/:userId
   */
  fastify.get<{
    Params: AccountParams;
  }>(
    '/credits/account/:userId',
    async (
      request: FastifyRequest<{ Params: AccountParams }>,
      reply: FastifyReply
    ) => {
      const { userId } = request.params;

      try {
        const summary = creditsCalculator.getAccountSummary(userId);

        return reply.send({
          code: 0,
          message: 'success',
          data: {
            userId: summary.userId,
            totalCreditsUsed: summary.totalCreditsUsed,
            totalCost: summary.totalCost,
            creditsBalance: summary.creditsBalance,
            lastActivity: summary.lastActivity.toISOString(),
            topSkills: Array.from(summary.usageBySkill.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([skillId, credits]) => ({ skillId, credits })),
            usageByMessageType: Array.from(summary.usageByMessageType.entries())
              .map(([type, credits]) => ({ type, credits })),
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
   * 获取历史流水
   * GET /api/v1/credits/history/:userId
   */
  fastify.get<{
    Params: AccountParams;
    Querystring: HistoryQuerystring;
  }>(
    '/credits/history/:userId',
    async (
      request: FastifyRequest<{
        Params: AccountParams;
        Querystring: HistoryQuerystring;
      }>,
      reply: FastifyReply
    ) => {
      const { userId } = request.params;
      const { startDate, endDate, skillId, limit } = request.query;

      try {
        const records = creditsCalculator.getHistory(userId, {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          skillId,
          limit: limit ? parseInt(limit, 10) : 100,
        });

        return reply.send({
          code: 0,
          message: 'success',
          data: records.map(r => ({
            id: r.id,
            skillId: r.skillId,
            credits: r.credits,
            cost: r.cost,
            messageType: r.messageType,
            model: r.model,
            totalTokens: r.promptTokens + r.completionTokens,
            timestamp: r.timestamp.toISOString(),
          })),
          meta: {
            total: records.length,
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
   * 获取技能使用统计
   * GET /api/v1/credits/skills-usage/:skillId
   */
  fastify.get<{
    Params: SkillUsageParams;
  }>(
    '/credits/skills-usage/:skillId',
    async (
      request: FastifyRequest<{ Params: SkillUsageParams }>,
      reply: FastifyReply
    ) => {
      const { skillId } = request.params;

      try {
        const stats = creditsCalculator.getSkillUsageStats(skillId);

        return reply.send({
          code: 0,
          message: 'success',
          data: {
            skillId,
            totalCredits: stats.totalCredits,
            totalCost: stats.totalCost,
            totalCalls: stats.totalCalls,
            avgCreditsPerCall: stats.avgCreditsPerCall,
            usageByMessageType: Array.from(stats.usageByMessageType.entries())
              .map(([type, credits]) => ({ type, credits })),
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
   * 获取技能使用分布（按技能）
   * GET /api/v1/credits/distribution
   */
  fastify.get<{
    Querystring: { userId?: string; limit?: string };
  }>(
    '/credits/distribution',
    async (
      request: FastifyRequest<{
        Querystring: { userId?: string; limit?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { userId, limit } = request.query;

      try {
        // 如果有 userId，返回该用户的分布
        if (userId) {
          const summary = creditsCalculator.getAccountSummary(userId);
          const distribution = Array.from(summary.usageBySkill.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit ? parseInt(limit, 10) : 20)
            .map(([skillId, credits]) => ({
              skillId,
              credits,
              percentage: summary.totalCreditsUsed > 0 
                ? (credits / summary.totalCreditsUsed * 100).toFixed(2)
                : '0',
            }));

          return reply.send({
            code: 0,
            message: 'success',
            data: distribution,
          });
        }

        // 否则返回全局分布（需要聚合所有记录）
        const skillTotals = new Map<string, number>();
        // 这里简化实现，实际应从数据库获取
        
        return reply.send({
          code: 0,
          message: 'success',
          data: [],
          note: 'Global distribution requires database aggregation',
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
   * 估算 Credits 消耗
   * POST /api/v1/credits/estimate
   */
  fastify.post<{
    Body: EstimateBody;
  }>(
    '/credits/estimate',
    async (
      request: FastifyRequest<{ Body: EstimateBody }>,
      reply: FastifyReply
    ) => {
      const { messageType, estimatedPromptTokens, estimatedCompletionTokens, model } = request.body;

      if (!messageType || !estimatedPromptTokens || !estimatedCompletionTokens) {
        return reply.status(400).send({
          code: 400,
          message: 'Missing required fields: messageType, estimatedPromptTokens, estimatedCompletionTokens',
        });
      }

      try {
        const result = creditsCalculator.estimateCredits(
          messageType,
          estimatedPromptTokens,
          estimatedCompletionTokens,
          model || 'default'
        );

        return reply.send({
          code: 0,
          message: 'success',
          data: {
            credits: result.credits,
            cost: result.cost,
            totalTokens: result.totalTokens,
            messageType: result.messageType,
            model: result.model,
            weightApplied: result.weightApplied,
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
   * 记录使用（手动）
   * POST /api/v1/credits/record
   */
  fastify.post<{
    Body: RecordBody;
  }>(
    '/credits/record',
    async (
      request: FastifyRequest<{ Body: RecordBody }>,
      reply: FastifyReply
    ) => {
      const { userId, skillId, sessionId, messageType, promptTokens, completionTokens, model, metadata } = request.body;

      if (!userId || !skillId || !sessionId || !messageType || !promptTokens || !completionTokens) {
        return reply.status(400).send({
          code: 400,
          message: 'Missing required fields',
        });
      }

      try {
        const creditResult = creditsCalculator.calculate(
          messageType,
          promptTokens,
          completionTokens,
          model || 'default'
        );

        const record = creditsCalculator.recordUsage(
          userId,
          skillId,
          sessionId,
          creditResult,
          metadata
        );

        return reply.send({
          code: 0,
          message: 'success',
          data: {
            id: record.id,
            credits: record.credits,
            cost: record.cost,
            timestamp: record.timestamp.toISOString(),
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
   * 获取订阅等级列表
   * GET /api/v1/credits/tiers
   */
  fastify.get(
    '/credits/tiers',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const tiers = creditsCalculator.getSubscriptionTiers();

        return reply.send({
          code: 0,
          message: 'success',
          data: tiers.map(t => ({
            name: t.name,
            monthlyPrice: t.monthlyPrice,
            includedCredits: t.includedCredits,
            additionalCreditsPrice: t.additionalCreditsPrice,
            features: t.features,
          })),
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
   * 获取单个订阅等级详情
   * GET /api/v1/credits/tiers/:name
   */
  fastify.get<{
    Params: { name: string };
  }>(
    '/credits/tiers/:name',
    async (
      request: FastifyRequest<{ Params: { name: string } }>,
      reply: FastifyReply
    ) => {
      const { name } = request.params;

      try {
        const tier = creditsCalculator.getSubscriptionTier(name);

        if (!tier) {
          return reply.status(404).send({
            code: 404,
            message: 'Tier not found',
          });
        }

        return reply.send({
          code: 0,
          message: 'success',
          data: {
            name: tier.name,
            monthlyPrice: tier.monthlyPrice,
            includedCredits: tier.includedCredits,
            additionalCreditsPrice: tier.additionalCreditsPrice,
            features: tier.features,
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
   * 获取支持的模型定价
   * GET /api/v1/credits/models
   */
  fastify.get(
    '/credits/models',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const models = [
          { model: 'gpt-4o', provider: 'openai', promptPrice: 0.0025, completionPrice: 0.01 },
          { model: 'gpt-4o-mini', provider: 'openai', promptPrice: 0.00015, completionPrice: 0.0006 },
          { model: 'gpt-4-turbo', provider: 'openai', promptPrice: 0.01, completionPrice: 0.03 },
          { model: 'claude-3.5-sonnet', provider: 'anthropic', promptPrice: 0.003, completionPrice: 0.015 },
          { model: 'claude-3-opus', provider: 'anthropic', promptPrice: 0.015, completionPrice: 0.075 },
          { model: 'gemini-1.5-pro', provider: 'google', promptPrice: 0.00125, completionPrice: 0.005 },
        ];

        return reply.send({
          code: 0,
          message: 'success',
          data: models,
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