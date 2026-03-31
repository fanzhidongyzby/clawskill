/**
 * Quality Score 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QualityScoreService, qualityScoreService } from './quality-score';
import type { Skill } from '../types/skill';

const mockSkill: Skill = {
  id: 'test/pdf-processor',
  name: 'pdf-processor',
  namespace: 'test',
  description: 'Extracts text from PDF files. Use when user mentions PDFs. Supports batch processing and OCR for scanned documents.',
  author: 'test-author',
  license: 'MIT',
  version: '1.0.0',
  keywords: ['pdf', 'document', 'ocr', 'batch'],
  categories: ['document-processing'],
  downloads: 1500,
  stars: 200,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
};

const mockSkillLowQuality: Skill = {
  id: 'test/bad-skill',
  name: 'bad-skill',
  namespace: 'test',
  description: 'A skill', // 短描述
  author: 'unknown',
  license: 'UNLICENSED',
  version: '0.1.0',
  keywords: [],
  categories: [],
  downloads: 10,
  stars: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('QualityScoreService', () => {
  let service: QualityScoreService;

  beforeEach(() => {
    service = new QualityScoreService();
    service.clearCache();
  });

  describe('calculateQualityScore', () => {
    it('should calculate a score for a skill', async () => {
      const result = await service.calculateQualityScore(mockSkill);

      expect(result.skillId).toBe(mockSkill.id);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.score100).toBeGreaterThanOrEqual(0);
      expect(result.score100).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
      expect(['recommended', 'good', 'acceptable', 'caution', 'avoid']).toContain(result.recommendation);
    });

    it('should return higher score for high-quality skill', async () => {
      const highQualityResult = await service.calculateQualityScore(mockSkill);
      const lowQualityResult = await service.calculateQualityScore(mockSkillLowQuality);

      expect(highQualityResult.score).toBeGreaterThan(lowQualityResult.score);
      expect(highQualityResult.grade).not.toBe('F');
    });

    it('should have valid dimensions', async () => {
      const result = await service.calculateQualityScore(mockSkill);

      expect(result.dimensions).toBeDefined();
      expect(result.dimensions.goalFulfillment).toBeDefined();
      expect(result.dimensions.efficiency).toBeDefined();
      expect(result.dimensions.safety).toBeDefined();
      expect(result.dimensions.robustness).toBeDefined();
      expect(result.dimensions.userExperience).toBeDefined();

      // 检查权重
      expect(result.dimensions.goalFulfillment.weight).toBe(0.3);
      expect(result.dimensions.efficiency.weight).toBe(0.2);
      expect(result.dimensions.safety.weight).toBe(0.2);
      expect(result.dimensions.robustness.weight).toBe(0.15);
      expect(result.dimensions.userExperience.weight).toBe(0.15);
    });

    it('should cache results', async () => {
      const result1 = await service.calculateQualityScore(mockSkill);
      const cached = service.getCached(mockSkill.id);

      expect(cached).toBeDefined();
      expect(cached?.skillId).toBe(mockSkill.id);
      expect(cached?.score).toBe(result1.score);
    });

    it('should expire cache after TTL', async () => {
      const shortTTLService = new QualityScoreService({ cacheTTLHours: 0 });
      await shortTTLService.calculateQualityScore(mockSkill);

      // TTL 为 0，缓存应立即过期
      const cached = shortTTLService.getCached(mockSkill.id);
      expect(cached).toBeNull();
    });
  });

  describe('calculateBatch', () => {
    it('should calculate scores for multiple skills', async () => {
      const skills = [mockSkill, mockSkillLowQuality];
      const results = await service.calculateBatch(skills);

      expect(results.length).toBe(2);
      expect(results[0].skillId).toBe(mockSkill.id);
      expect(results[1].skillId).toBe(mockSkillLowQuality.id);
    });
  });

  describe('getGrade', () => {
    it('should return correct grades', async () => {
      // 测试不同分数对应不同等级
      const results = await service.calculateQualityScore(mockSkill);
      
      // 验证等级与分数的关系
      if (results.score >= 0.90) expect(results.grade).toBe('A');
      else if (results.score >= 0.80) expect(results.grade).toBe('B');
      else if (results.score >= 0.70) expect(results.grade).toBe('C');
      else if (results.score >= 0.60) expect(results.grade).toBe('D');
      else expect(results.grade).toBe('F');
    });
  });

  describe('getRecommendation', () => {
    it('should return correct recommendations', async () => {
      const results = await service.calculateQualityScore(mockSkill);

      // 验证推荐与分数的关系
      if (results.score >= 0.90) expect(results.recommendation).toBe('recommended');
      else if (results.score >= 0.80) expect(results.recommendation).toBe('good');
      else if (results.score >= 0.70) expect(results.recommendation).toBe('acceptable');
      else if (results.score >= 0.60) expect(results.recommendation).toBe('caution');
      else expect(results.recommendation).toBe('avoid');
    });
  });

  describe('clearCache', () => {
    it('should clear all cache', async () => {
      await service.calculateQualityScore(mockSkill);
      service.clearCache();
      expect(service.getCached(mockSkill.id)).toBeNull();
    });

    it('should clear specific skill cache', async () => {
      await service.calculateQualityScore(mockSkill);
      await service.calculateQualityScore(mockSkillLowQuality);

      service.clearCache(mockSkill.id);

      expect(service.getCached(mockSkill.id)).toBeNull();
      expect(service.getCached(mockSkillLowQuality.id)).toBeDefined();
    });
  });
});

describe('Quality Score Dimensions', () => {
  let service: QualityScoreService;

  beforeEach(() => {
    service = new QualityScoreService();
    service.clearCache();
  });

  it('should evaluate goal fulfillment correctly', async () => {
    const result = await service.calculateQualityScore(mockSkill);

    expect(result.dimensions.goalFulfillment.metrics.descriptionClarity).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.goalFulfillment.metrics.installSuccess).toBeGreaterThanOrEqual(0);
  });

  it('should evaluate safety correctly for MIT license', async () => {
    const result = await service.calculateQualityScore(mockSkill);

    // MIT 是安全许可证
    expect(result.dimensions.safety.metrics.licenseCompliance).toBe(1.0);
  });

  it('should evaluate safety correctly for UNLICENSED', async () => {
    const result = await service.calculateQualityScore(mockSkillLowQuality);

    // UNLICENSED 有合规风险
    expect(result.dimensions.safety.metrics.licenseCompliance).toBeLessThan(0.5);
  });

  it('should evaluate user experience correctly', async () => {
    const highQualityResult = await service.calculateQualityScore(mockSkill);
    const lowQualityResult = await service.calculateQualityScore(mockSkillLowQuality);

    // 高质量技能应有更好的用户体验评分
    expect(highQualityResult.dimensions.userExperience.score)
      .toBeGreaterThan(lowQualityResult.dimensions.userExperience.score);
  });
});

describe('Quality Score Weight Calculation', () => {
  let service: QualityScoreService;

  beforeEach(() => {
    service = new QualityScoreService();
    service.clearCache();
  });

  it('should apply correct weights', async () => {
    const result = await service.calculateQualityScore(mockSkill);

    // 验证加权总分计算
    const expectedScore = 
      result.dimensions.goalFulfillment.score * 0.3 +
      result.dimensions.efficiency.score * 0.2 +
      result.dimensions.safety.score * 0.2 +
      result.dimensions.robustness.score * 0.15 +
      result.dimensions.userExperience.score * 0.15;

    expect(Math.abs(result.score - expectedScore)).toBeLessThan(0.001);
  });

  it('should use custom weights', async () => {
    const customService = new QualityScoreService({
      weights: {
        goalFulfillment: 0.4,
        efficiency: 0.3,
        safety: 0.1,
        robustness: 0.1,
        userExperience: 0.1,
      },
    });

    const result = await customService.calculateQualityScore(mockSkill);

    // 权重总和应为 1
    const weightSum = 
      result.dimensions.goalFulfillment.weight +
      result.dimensions.efficiency.weight +
      result.dimensions.safety.weight +
      result.dimensions.robustness.weight +
      result.dimensions.userExperience.weight;

    expect(weightSum).toBeCloseTo(1, 2);
  });
});