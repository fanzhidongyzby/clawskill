/**
 * Credits Calculator 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CreditsCalculator, LLMInterceptor } from './credits-calculator';

describe('CreditsCalculator', () => {
  let calculator: CreditsCalculator;

  beforeEach(() => {
    calculator = new CreditsCalculator();
    calculator.clearRecords();
  });

  describe('calculate', () => {
    it('should calculate credits correctly', () => {
      const result = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');

      expect(result.promptTokens).toBe(1000);
      expect(result.completionTokens).toBe(500);
      expect(result.totalTokens).toBe(1500);
      expect(result.messageType).toBe('collaboration');
      expect(result.model).toBe('gpt-4o');
      expect(result.credits).toBeGreaterThan(0);
      expect(result.cost).toBeGreaterThan(0);
    });

    it('should apply completion multiplier', () => {
      const result1 = calculator.calculate('collaboration', 1000, 1000, 'gpt-4o');
      
      // 输出 tokens 权重是 3 倍，所以 1000 输出 tokens 相当于 3000 输入 tokens 的成本权重
      expect(result1.cost).toBeGreaterThan(0);
    });

    it('should apply message type weights', () => {
      const collaborationResult = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');
      const explorationResult = calculator.calculate('exploration', 1000, 500, 'gpt-4o');
      const reasoningResult = calculator.calculate('reasoning', 1000, 500, 'gpt-4o');

      // exploration 权重 0.5，应该比 collaboration (1.0) 低
      expect(collaborationResult.credits).toBeGreaterThan(explorationResult.credits);
      
      // reasoning 权重 1.2，应该比 collaboration (1.0) 高
      expect(reasoningResult.credits).toBeGreaterThan(collaborationResult.credits);
    });

    it('should use default model when unknown model specified', () => {
      const result = calculator.calculate('collaboration', 1000, 500, 'unknown-model');

      expect(result.model).toBe('unknown-model');
      expect(result.credits).toBeGreaterThan(0);
    });
  });

  describe('recordUsage', () => {
    it('should record usage correctly', () => {
      const result = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');
      const record = calculator.recordUsage('user-1', 'skill-1', 'session-1', result);

      expect(record.id).toBeDefined();
      expect(record.userId).toBe('user-1');
      expect(record.skillId).toBe('skill-1');
      expect(record.sessionId).toBe('session-1');
      expect(record.credits).toBe(result.credits);
      expect(record.timestamp).toBeDefined();
    });
  });

  describe('getAccountSummary', () => {
    it('should return correct account summary', () => {
      // 添加一些记录
      const result1 = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');
      calculator.recordUsage('user-1', 'skill-1', 'session-1', result1);

      const result2 = calculator.calculate('exploration', 2000, 1000, 'gpt-4o-mini');
      calculator.recordUsage('user-1', 'skill-2', 'session-2', result2);

      const summary = calculator.getAccountSummary('user-1');

      expect(summary.userId).toBe('user-1');
      expect(summary.totalCreditsUsed).toBe(result1.credits + result2.credits);
      expect(summary.totalCost).toBe(result1.cost + result2.cost);
      expect(summary.usageBySkill.size).toBe(2);
    });

    it('should return empty summary for unknown user', () => {
      const summary = calculator.getAccountSummary('unknown-user');

      expect(summary.userId).toBe('unknown-user');
      expect(summary.totalCreditsUsed).toBe(0);
      expect(summary.totalCost).toBe(0);
      expect(summary.usageBySkill.size).toBe(0);
    });
  });

  describe('getSkillUsageStats', () => {
    it('should return correct skill usage stats', () => {
      const result = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');
      calculator.recordUsage('user-1', 'skill-1', 'session-1', result);
      calculator.recordUsage('user-2', 'skill-1', 'session-2', result);

      const stats = calculator.getSkillUsageStats('skill-1');

      expect(stats.totalCredits).toBe(result.credits * 2);
      expect(stats.totalCalls).toBe(2);
      expect(stats.avgCreditsPerCall).toBe(result.credits);
    });
  });

  describe('getHistory', () => {
    it('should return history correctly', () => {
      const result = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');
      
      calculator.recordUsage('user-1', 'skill-1', 'session-1', result);
      calculator.recordUsage('user-1', 'skill-2', 'session-2', result);
      calculator.recordUsage('user-1', 'skill-1', 'session-3', result);

      const history = calculator.getHistory('user-1');

      expect(history.length).toBe(3);
      // 应按时间降序
      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(history[1].timestamp.getTime());
    });

    it('should filter by skillId', () => {
      const result = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');
      
      calculator.recordUsage('user-1', 'skill-1', 'session-1', result);
      calculator.recordUsage('user-1', 'skill-2', 'session-2', result);

      const history = calculator.getHistory('user-1', { skillId: 'skill-1' });

      expect(history.length).toBe(1);
      expect(history[0].skillId).toBe('skill-1');
    });

    it('should respect limit', () => {
      const result = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');
      
      for (let i = 0; i < 50; i++) {
        calculator.recordUsage('user-1', 'skill-1', `session-${i}`, result);
      }

      const history = calculator.getHistory('user-1', { limit: 10 });

      expect(history.length).toBe(10);
    });
  });

  describe('getSubscriptionTier', () => {
    it('should return correct tier', () => {
      const freeTier = calculator.getSubscriptionTier('free');
      const proTier = calculator.getSubscriptionTier('pro');

      expect(freeTier?.name).toBe('free');
      expect(freeTier?.monthlyPrice).toBe(0);
      expect(proTier?.name).toBe('pro');
      expect(proTier?.monthlyPrice).toBe(29);
    });

    it('should return null for unknown tier', () => {
      const unknownTier = calculator.getSubscriptionTier('unknown');
      expect(unknownTier).toBeNull();
    });
  });

  describe('estimateCredits', () => {
    it('should estimate credits correctly', () => {
      const estimate = calculator.estimateCredits('collaboration', 1000, 500, 'gpt-4o');
      const actual = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');

      expect(estimate.credits).toBe(actual.credits);
      expect(estimate.cost).toBe(actual.cost);
    });
  });

  describe('clearRecords', () => {
    it('should clear all records', () => {
      const result = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');
      calculator.recordUsage('user-1', 'skill-1', 'session-1', result);

      calculator.clearRecords();

      const summary = calculator.getAccountSummary('user-1');
      expect(summary.totalCreditsUsed).toBe(0);
    });

    it('should clear records for specific user', () => {
      const result = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');
      calculator.recordUsage('user-1', 'skill-1', 'session-1', result);
      calculator.recordUsage('user-2', 'skill-1', 'session-1', result);

      calculator.clearRecords('user-1');

      const summary1 = calculator.getAccountSummary('user-1');
      const summary2 = calculator.getAccountSummary('user-2');

      expect(summary1.totalCreditsUsed).toBe(0);
      expect(summary2.totalCreditsUsed).toBeGreaterThan(0);
    });
  });
});

describe('LLMInterceptor', () => {
  let calculator: CreditsCalculator;
  let interceptor: LLMInterceptor;

  beforeEach(() => {
    calculator = new CreditsCalculator();
    calculator.clearRecords();
    interceptor = new LLMInterceptor(calculator, 'user-1', 'session-1', 'skill-1');
  });

  describe('wrapLLMCall', () => {
    it('should wrap LLM call and record usage', async () => {
      const mockLLMCall = async () => ({
        result: 'test result',
        usage: { promptTokens: 1000, completionTokens: 500 },
      });

      const { result, creditResult, record } = await interceptor.wrapLLMCall(
        'collaboration',
        'gpt-4o',
        mockLLMCall
      );

      expect(result).toBe('test result');
      expect(creditResult.promptTokens).toBe(1000);
      expect(creditResult.completionTokens).toBe(500);
      expect(record.userId).toBe('user-1');
      expect(record.skillId).toBe('skill-1');
    });
  });

  describe('preEstimate', () => {
    it('should pre-estimate credits', () => {
      const estimate = interceptor.preEstimate('collaboration', 1000, 500, 'gpt-4o');

      expect(estimate.credits).toBeGreaterThan(0);
      expect(estimate.cost).toBeGreaterThan(0);
    });
  });
});

describe('Credits Calculation Edge Cases', () => {
  let calculator: CreditsCalculator;

  beforeEach(() => {
    calculator = new CreditsCalculator();
  });

  it('should handle zero tokens', () => {
    const result = calculator.calculate('collaboration', 0, 0, 'gpt-4o');

    expect(result.credits).toBe(0);
    expect(result.cost).toBe(0);
  });

  it('should handle very large token counts', () => {
    const result = calculator.calculate('collaboration', 100000, 50000, 'gpt-4o');

    expect(result.credits).toBeGreaterThan(0);
    expect(result.totalTokens).toBe(150000);
  });

  it('should handle unknown message types with default weight', () => {
    const result = calculator.calculate('unknown_type', 1000, 500, 'gpt-4o');

    expect(result.weightApplied).toBe(1.0);
  });

  it('should calculate correctly with custom config', () => {
    const customCalculator = new CreditsCalculator({
      exchangeRate: 0.25, // 更低的汇率，更多 Credits
      completionMultiplier: 2, // 更低的输出权重
    });

    const customResult = customCalculator.calculate('collaboration', 1000, 500, 'gpt-4o');
    const defaultResult = calculator.calculate('collaboration', 1000, 500, 'gpt-4o');

    // 更低的汇率会产生更多 Credits
    expect(customResult.credits).toBeGreaterThan(defaultResult.credits);
  });
});