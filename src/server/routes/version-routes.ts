/**
 * Skill Version Management API routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { SkillService } from '../core/skill-service';

// Request schemas
const VersionCreateSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().optional(),
  changelog: z.string().optional(),
});

const VersionUpdateSchema = z.object({
  description: z.string().optional(),
  changelog: z.string().optional(),
});

const RollbackSchema = z.object({
  toVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
});

interface VersionRoutesOptions {
  skillService: SkillService;
}

export async function registerVersionRoutes(
  fastify: FastifyInstance,
  options: { prefix?: string } & VersionRoutesOptions
): Promise<void> {
  // prefix is handled by fastify.register({ prefix })
  const { skillService } = options;

  // GET /skills/:skillId/versions - List all versions of a skill
  fastify.get<{ Params: { skillId: string } }>(
    '/skills/:skillId/versions',
    async (request, reply) => {
      try {
        const { skillId } = request.params;

        // Get skill metadata
        const skill = await skillService.get(skillId);
        if (!skill) {
          return reply.code(404).send({ error: 'Skill not found' });
        }

        // Get all versions (TODO: Implement version listing in SkillService)
        const versions = await skillService.listVersions(skillId);

        return {
          skillId,
          skillName: skill.name,
          versions,
        };
      } catch (error) {
        fastify.log.error('List versions error:', error);
        return reply.code(500).send({ error: 'Failed to list versions' });
      }
    }
  );

  // GET /skills/:skillId/versions/:version - Get specific version
  fastify.get<{ Params: { skillId: string; version: string } }>(
    '/skills/:skillId/versions/:version',
    async (request, reply) => {
      try {
        const { skillId, version } = request.params;

        const versionData = await skillService.getVersion(skillId, version);
        if (!versionData) {
          return reply.code(404).send({ error: 'Version not found' });
        }

        return versionData;
      } catch (error) {
        fastify.log.error('Get version error:', error);
        return reply.code(500).send({ error: 'Failed to get version' });
      }
    }
  );

  // POST /skills/:skillId/versions - Create new version
  fastify.post<{ Params: { skillId: string }; Body: z.infer<typeof VersionCreateSchema> }>(
    '/skills/:skillId/versions',
    async (request, reply) => {
      try {
        const { skillId } = request.params;
        const data = VersionCreateSchema.parse(request.body);

        // Check if skill exists
        const skill = await skillService.get(skillId);
        if (!skill) {
          return reply.code(404).send({ error: 'Skill not found' });
        }

        // Create new version (TODO: Implement version creation in SkillService)
        const newVersion = await skillService.createVersion(skillId, {
          version: data.version,
          description: data.description || `Release ${data.version}`,
          changelog: data.changelog || '',
          createdAt: new Date().toISOString(),
        });

        return reply.code(201).send(newVersion);
      } catch (error) {
        fastify.log.error('Create version error:', error);
        return reply.code(500).send({ error: 'Failed to create version' });
      }
    }
  );

  // PUT /skills/:skillId/versions/:version - Update version metadata
  fastify.put<{ Params: { skillId: string; version: string }; Body: z.infer<typeof VersionUpdateSchema> }>(
    '/skills/:skillId/versions/:version',
    async (request, reply) => {
      try {
        const { skillId, version } = request.params;
        const data = VersionUpdateSchema.parse(request.body);

        // Update version metadata (TODO: Implement version update in SkillService)
        const updatedVersion = await skillService.updateVersion(skillId, version, data);

        if (!updatedVersion) {
          return reply.code(404).send({ error: 'Version not found' });
        }

        return updatedVersion;
      } catch (error) {
        fastify.log.error('Update version error:', error);
        return reply.code(500).send({ error: 'Failed to update version' });
      }
    }
  );

  // DELETE /skills/:skillId/versions/:version - Delete version
  fastify.delete<{ Params: { skillId: string; version: string } }>(
    '/skills/:skillId/versions/:version',
    async (request, reply) => {
      try {
        const { skillId, version } = request.params;

        // Check if version exists
        const versionData = await skillService.getVersion(skillId, version);
        if (!versionData) {
          return reply.code(404).send({ error: 'Version not found' });
        }

        // Delete version (TODO: Implement version deletion in SkillService)
        await skillService.deleteVersion(skillId, version);

        return { message: 'Version deleted successfully' };
      } catch (error) {
        fastify.log.error('Delete version error:', error);
        return reply.code(500).send({ error: 'Failed to delete version' });
      }
    }
  );

  // POST /skills/:skillId/rollback - Rollback to previous version
  fastify.post<{ Params: { skillId: string }; Body: z.infer<typeof RollbackSchema> }>(
    '/skills/:skillId/rollback',
    async (request, reply) => {
      try {
        const { skillId } = request.params;
        const { toVersion } = RollbackSchema.parse(request.body);

        // Check if skill exists
        const skill = await skillService.get(skillId);
        if (!skill) {
          return reply.code(404).send({ error: 'Skill not found' });
        }

        // Check if target version exists
        const targetVersion = await skillService.getVersion(skillId, toVersion);
        if (!targetVersion) {
          return reply.code(404).send({ error: 'Target version not found' });
        }

        // Rollback (TODO: Implement rollback in SkillService)
        await skillService.rollback(skillId, toVersion);

        return {
          message: 'Rollback successful',
          skillId,
          toVersion,
        };
      } catch (error) {
        fastify.log.error('Rollback error:', error);
        return reply.code(500).send({ error: 'Failed to rollback' });
      }
    }
  );

  // GET /skills/:skillId/version/latest - Get latest version
  fastify.get<{ Params: { skillId: string } }>(
    '/skills/:skillId/version/latest',
    async (request, reply) => {
      try {
        const { skillId } = request.params;

        // Get skill metadata
        const skill = await skillService.get(skillId);
        if (!skill) {
          return reply.code(404).send({ error: 'Skill not found' });
        }

        // Get latest version
        const latestVersion = await skillService.getVersion(skillId, skill.version);

        return latestVersion;
      } catch (error) {
        fastify.log.error('Get latest version error:', error);
        return reply.code(500).send({ error: 'Failed to get latest version' });
      }
    }
  );
}