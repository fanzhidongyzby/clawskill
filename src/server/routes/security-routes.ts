/**
 * 安全扫描 API 路由
 */
import type { FastifyInstance } from 'fastify';
import { SecurityScanner } from '../../security/scanner/security-scanner';

const scanner = new SecurityScanner();

/**
 * 注册安全路由
 */
export async function registerSecurityRoutes(fastify: FastifyInstance): Promise<void> {
  // 创建扫描任务
  fastify.post('/security/scan', async (request) => {
    const { skillId, version } = request.body as { skillId?: string; version?: string };

    if (!skillId) {
      throw fastify.httpErrors.badRequest('skillId is required');
    }

    const scan = await scanner.scan(skillId, version);
    return scan;
  });

  // 获取扫描结果
  fastify.get('/security/scan/:scanId', async (request) => {
    const { scanId } = request.params as { scanId: string };

    const result = await scanner.getScanResult(scanId);
    return result;
  });

  // 获取安全报告
  fastify.get('/security/report/:skillId/:version', async (request) => {
    const { skillId, version } = request.params as { skillId: string; version: string };

    const report = await scanner.getReport(skillId, version);
    return report;
  });

  // 敏感信息扫描
  fastify.post('/security/scan-secrets', async (request) => {
    const { files } = request.body as { files?: string[] };

    if (!files || files.length === 0) {
      throw fastify.httpErrors.badRequest('files is required');
    }

    const result = await scanner.scanSecrets(files);
    return result;
  });

  // 依赖漏洞扫描
  fastify.post('/security/scan-dependencies', async (request) => {
    const { dependencies } = request.body as { dependencies?: Record<string, string> };

    if (!dependencies) {
      throw fastify.httpErrors.badRequest('dependencies is required');
    }

    const result = await scanner.scanDependencies(dependencies);
    return result;
  });

  // 获取安全统计
  fastify.get('/security/stats/:skillId', async (request) => {
    const { skillId } = request.params as { skillId: string };

    const stats = await scanner.getStats(skillId);
    return stats;
  });

  // 获取安全发现
  fastify.get('/security/findings', async (request) => {
    const { skillId, severity } = request.query as Record<string, string>;

    const findings = await scanner.getFindings({
      skillId,
      severity: severity as any,
    });

    return { data: findings };
  });
}