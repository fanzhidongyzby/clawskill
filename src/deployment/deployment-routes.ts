/**
 * 私有部署 API 路由
 *
 * 端点：
 * - GET /api/v1/deployment/config - 获取部署配置
 * - POST /api/v1/deployment/validate - 验证部署
 * - GET /api/v1/deployment/manifest - 获取 Kubernetes 清单
 * - GET /api/v1/deployment/index-packages - 获取索引包列表
 * - POST /api/v1/deployment/index-packages/import - 导入索引包
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  AirGappedValidator,
  OfflineIndexPackageManager,
  DeploymentConfig,
  DEFAULT_AIR_GAPPED_CONFIG,
} from './air-gapped';

interface ValidateBody {
  config: DeploymentConfig;
}

interface ImportPackageBody {
  packagePath: string;
}

/**
 * 注册私有部署路由
 */
export async function registerDeploymentRoutes(
  fastify: FastifyInstance,
  options: { prefix: string }
): Promise<void> {
  const validator = new AirGappedValidator();
  const packageManager = new OfflineIndexPackageManager();

  /**
   * 获取部署配置
   * GET /api/v1/deployment/config
   */
  fastify.get(
    '/deployment/config',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      return reply.send({
        code: 0,
        message: 'success',
        data: DEFAULT_AIR_GAPPED_CONFIG,
      });
    }
  );

  /**
   * 验证部署
   * POST /api/v1/deployment/validate
   */
  fastify.post<{
    Body: ValidateBody;
  }>(
    '/deployment/validate',
    async (
      request: FastifyRequest<{ Body: ValidateBody }>,
      reply: FastifyReply
    ) => {
      const { config } = request.body;

      if (!config) {
        return reply.status(400).send({
          code: 400,
          message: 'config is required',
        });
      }

      try {
        const customValidator = new AirGappedValidator(config);
        const result = await customValidator.validate();

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
        });
      }
    }
  );

  /**
   * 获取 Kubernetes 清单
   * GET /api/v1/deployment/manifest
   */
  fastify.get(
    '/deployment/manifest',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const manifest = validator.generateKubernetesManifest();

        return reply
          .type('text/yaml')
          .send(manifest);
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
   * 获取索引包列表
   * GET /api/v1/deployment/index-packages
   */
  fastify.get(
    '/deployment/index-packages',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const packages = packageManager.getImportedPackages();

        return reply.send({
          code: 0,
          message: 'success',
          data: packages.map(pkg => ({
            id: pkg.id,
            version: pkg.version,
            createdAt: pkg.createdAt.toISOString(),
            totalSkills: pkg.metadata.totalSkills,
            totalSize: pkg.metadata.totalSize,
          })),
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
   * 导入索引包
   * POST /api/v1/deployment/index-packages/import
   */
  fastify.post<{
    Body: ImportPackageBody;
  }>(
    '/deployment/index-packages/import',
    async (
      request: FastifyRequest<{ Body: ImportPackageBody }>,
      reply: FastifyReply
    ) => {
      const { packagePath } = request.body;

      if (!packagePath) {
        return reply.status(400).send({
          code: 400,
          message: 'packagePath is required',
        });
      }

      try {
        const pkg = await packageManager.importPackage(packagePath);
        const verification = await packageManager.verifyPackage(pkg);

        return reply.send({
          code: 0,
          message: verification.valid
            ? 'Index package imported and verified'
            : 'Index package imported with warnings',
          data: {
            packageId: pkg.id,
            version: pkg.version,
            totalSkills: pkg.metadata.totalSkills,
            verification,
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
   * 获取部署状态
   * GET /api/v1/deployment/status
   */
  fastify.get(
    '/deployment/status',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const validation = await validator.validate();
        const latestPackage = packageManager.getLatestPackage();

        return reply.send({
          code: 0,
          message: 'success',
          data: {
            mode: DEFAULT_AIR_GAPPED_CONFIG.mode,
            valid: validation.valid,
            indexPackage: latestPackage ? {
              version: latestPackage.version,
              importedAt: latestPackage.createdAt.toISOString(),
              totalSkills: latestPackage.metadata.totalSkills,
            } : null,
            checks: {
              networkIsolation: validation.checks.networkIsolation.passed,
              telemetryDisabled: validation.checks.telemetryDisabled.passed,
              offlineStorage: validation.checks.offlineStorage.passed,
              localDatabase: validation.checks.localDatabase.passed,
              securityConfig: validation.checks.securityConfig.passed,
            },
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