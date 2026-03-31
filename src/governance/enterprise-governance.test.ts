/**
 * 开发者工具链 & 企业治理 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeveloperToolchainService, PublishService } from '../toolchain/developer-toolchain';
import { EnterpriseGovernanceService } from './enterprise-governance';

describe('DeveloperToolchainService', () => {
  let service: DeveloperToolchainService;

  beforeEach(() => {
    service = new DeveloperToolchainService();
  });

  describe('createSandbox', () => {
    it('should create a sandbox', async () => {
      const sandbox = await service.createSandbox('skill-1');

      expect(sandbox.id).toBeDefined();
      expect(sandbox.skillId).toBe('skill-1');
      expect(sandbox.status).toBe('pending');
    });
  });

  describe('runTests', () => {
    it('should run tests and return results', async () => {
      const sandbox = await service.createSandbox('skill-1');
      const result = await service.runTests(sandbox.id);

      expect(result.status).toMatch(/passed|failed/);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.duration).toBeDefined();
      expect(result.coverage).toBeGreaterThanOrEqual(70);
    });

    it('should throw for non-existent sandbox', async () => {
      await expect(service.runTests('non-existent')).rejects.toThrow();
    });
  });

  describe('analyzePerformance', () => {
    it('should generate performance report', async () => {
      const report = await service.analyzePerformance('skill-1');

      expect(report.skillId).toBe('skill-1');
      expect(report.metrics.avgResponseTime).toBeGreaterThan(0);
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });
});

describe('PublishService', () => {
  let service: PublishService;

  beforeEach(() => {
    service = new PublishService();
  });

  describe('publish', () => {
    it('should publish a skill', async () => {
      const result = await service.publish('skill-1', '1.0.0');

      expect(result.success).toBe(true);
      expect(result.message).toContain('published');
    });
  });

  describe('getPublishStatus', () => {
    it('should return null for unpublished skill', () => {
      const status = service.getPublishStatus('non-existent');
      expect(status).toBeNull();
    });

    it('should return status for published skill', async () => {
      await service.publish('skill-1', '1.0.0');
      const status = service.getPublishStatus('skill-1');

      expect(status).toBeDefined();
      expect(status?.version).toBe('1.0.0');
    });
  });
});

describe('EnterpriseGovernanceService', () => {
  let service: EnterpriseGovernanceService;

  beforeEach(() => {
    service = new EnterpriseGovernanceService();
  });

  describe('logAudit', () => {
    it('should create audit log entry', async () => {
      const entry = await service.logAudit({
        action: 'skill.install',
        actor: 'user-1',
        resource: 'skill',
        resourceId: 'skill-1',
        details: { version: '1.0.0' },
        outcome: 'success',
      });

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.action).toBe('skill.install');
    });
  });

  describe('queryAuditLogs', () => {
    it('should query logs by actor', async () => {
      await service.logAudit({
        action: 'skill.install',
        actor: 'user-1',
        resource: 'skill',
        resourceId: 'skill-1',
        details: {},
        outcome: 'success',
      });

      await service.logAudit({
        action: 'skill.install',
        actor: 'user-2',
        resource: 'skill',
        resourceId: 'skill-2',
        details: {},
        outcome: 'success',
      });

      const logs = await service.queryAuditLogs({ actor: 'user-1' });

      expect(logs.length).toBe(1);
      expect(logs[0].actor).toBe('user-1');
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report', async () => {
      const report = await service.generateComplianceReport('eu-ai-act', {
        start: new Date('2026-01-01'),
        end: new Date('2026-03-31'),
      });

      expect(report.type).toBe('eu-ai-act');
      expect(report.summary.complianceRate).toBeGreaterThanOrEqual(0);
      expect(report.certifications.length).toBeGreaterThan(0);
    });
  });

  describe('requestCertification', () => {
    it('should create certification request', async () => {
      const cert = await service.requestCertification('skill-1', 'verified');

      expect(cert.skillId).toBe('skill-1');
      expect(cert.level).toBe('verified');
      expect(cert.tests.length).toBeGreaterThan(0);
    });

    it('should auto-approve if tests pass', async () => {
      const cert = await service.requestCertification('skill-1', 'verified');

      expect(cert.status).toBe('approved');
      expect(cert.certifiedAt).toBeDefined();
    });
  });

  describe('performImpactAssessment', () => {
    it('should perform impact assessment', async () => {
      const assessment = await service.performImpactAssessment('skill-1');

      expect(assessment.skillId).toBe('skill-1');
      expect(assessment.riskLevel).toMatch(/low|medium|high|critical/);
      expect(assessment.categories.length).toBeGreaterThan(0);
    });
  });

  describe('recordDataLineage', () => {
    it('should record data lineage', async () => {
      const lineage = await service.recordDataLineage({
        skillId: 'skill-1',
        sources: [{ type: 'user-input', identifier: 'prompt', description: 'User prompt' }],
        transformations: [{ step: 1, operation: 'process', input: 'prompt', output: 'result' }],
        destinations: [{ type: 'output', identifier: 'response' }],
      });

      expect(lineage.id).toBeDefined();
      expect(lineage.skillId).toBe('skill-1');
      expect(lineage.sources.length).toBeGreaterThan(0);
    });

    it('should retrieve data lineage', async () => {
      await service.recordDataLineage({
        skillId: 'skill-1',
        sources: [],
        transformations: [],
        destinations: [],
      });

      const lineage = service.getDataLineage('skill-1');

      expect(lineage.length).toBeGreaterThan(0);
    });
  });
});