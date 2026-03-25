/**
 * Local Skills Management API routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { SkillService } from '../core/skill-service';

// Request schemas
const InstallSkillSchema = z.object({
  skillId: z.string(),
  version: z.string().optional(),
});

const UninstallSkillSchema = z.object({
  skillId: z.string(),
});

const UpdateSkillSchema = z.object({
  skillId: z.string(),
  version: z.string().optional(),
});

interface LocalSkillsRoutesOptions {
  skillService: SkillService;
}

// In-memory storage for installed skills (TODO: Replace with persistent storage)
interface InstalledSkill {
  userId: string;
  skillId: string;
  version: string;
  installedAt: string;
  lastUsed: string;
}

const installedSkills: InstalledSkill[] = [];

// Helper functions
function getInstalledSkills(userId: string): InstalledSkill[] {
  return installedSkills.filter(s => s.userId === userId);
}

function getInstalledSkill(userId: string, skillId: string): InstalledSkill | undefined {
  return installedSkills.find(s => s.userId === userId && s.skillId === skillId);
}

function addInstalledSkill(userId: string, skillId: string, version: string): InstalledSkill {
  const installed: InstalledSkill = {
    userId,
    skillId,
    version,
    installedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  };
  installedSkills.push(installed);
  return installed;
}

function removeInstalledSkill(userId: string, skillId: string): boolean {
  const index = installedSkills.findIndex(s => s.userId === userId && s.skillId === skillId);
  if (index !== -1) {
    installedSkills.splice(index, 1);
    return true;
  }
  return false;
}

function updateInstalledSkill(userId: string, skillId: string, version: string): InstalledSkill | undefined {
  const skill = getInstalledSkill(userId, skillId);
  if (skill) {
    skill.version = version;
    skill.lastUsed = new Date().toISOString();
    return skill;
  }
  return undefined;
}

function getUserIdFromToken(fastify: FastifyInstance, request: FastifyRequest): string | null {
  const token = request.headers.authorization?.replace('Bearer ', '');
  // In a real implementation, this would validate the JWT token
  // For now, we'll use a simple token mapping
  if (token) {
    // TODO: Implement proper JWT validation
    return 'demo-user'; // Demo user ID
  }
  return null;
}

export async function registerLocalSkillsRoutes(
  fastify: FastifyInstance,
  options: { prefix?: string } & LocalSkillsRoutesOptions
): Promise<void> {
  const prefix = options.prefix || '/api/v1';
  const { skillService } = options;

  // GET /skills/installed - List all installed skills for current user
  fastify.get(
    `${prefix}/skills/installed`,
    async (request, reply) => {
      try {
        const userId = getUserIdFromToken(fastify, request);

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const installed = getInstalledSkills(userId);

        // Fetch skill metadata for each installed skill
        const skillsWithMetadata = await Promise.all(
          installed.map(async (installedSkill) => {
            const skill = await skillService.get(installedSkill.skillId);
            return {
              ...installedSkill,
              skill: skill ? {
                id: skill.id,
                name: skill.name,
                namespace: skill.namespace,
                description: skill.description,
                author: skill.author,
              } : null,
            };
          })
        );

        return {
          userId,
          count: skillsWithMetadata.length,
          items: skillsWithMetadata,
        };
      } catch (error) {
        fastify.log.error('List installed skills error:', error);
        return reply.code(500).send({ error: 'Failed to list installed skills' });
      }
    }
  );

  // POST /skills/installed/install - Install a skill
  fastify.post<{ Body: z.infer<typeof InstallSkillSchema> }>(
    `${prefix}/skills/installed/install`,
    async (request, reply) => {
      try {
        const userId = getUserIdFromToken(fastify, request);

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { skillId, version } = InstallSkillSchema.parse(request.body);

        // Check if skill exists
        const skill = await skillService.get(skillId);
        if (!skill) {
          return reply.code(404).send({ error: 'Skill not found' });
        }

        // Use specified version or latest
        const installVersion = version || skill.version;

        // Check if already installed
        if (getInstalledSkill(userId, skillId)) {
          return reply.code(409).send({ error: 'Skill already installed' });
        }

        // Install skill
        const installed = addInstalledSkill(userId, skillId, installVersion);

        return reply.code(201).send({
          message: 'Skill installed successfully',
          skillId,
          version: installVersion,
          installedAt: installed.installedAt,
        });
      } catch (error) {
        fastify.log.error('Install skill error:', error);
        return reply.code(500).send({ error: 'Failed to install skill' });
      }
    }
  );

  // POST /skills/installed/uninstall - Uninstall a skill
  fastify.post<{ Body: z.infer<typeof UninstallSkillSchema> }>(
    `${prefix}/skills/installed/uninstall`,
    async (request, reply) => {
      try {
        const userId = getUserIdFromToken(fastify, request);

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { skillId } = UninstallSkillSchema.parse(request.body);

        // Check if installed
        if (!getInstalledSkill(userId, skillId)) {
          return reply.code(404).send({ error: 'Skill not installed' });
        }

        // Uninstall skill
        const success = removeInstalledSkill(userId, skillId);

        if (success) {
          return {
            message: 'Skill uninstalled successfully',
            skillId,
          };
        } else {
          return reply.code(500).send({ error: 'Failed to uninstall skill' });
        }
      } catch (error) {
        fastify.log.error('Uninstall skill error:', error);
        return reply.code(500).send({ error: 'Failed to uninstall skill' });
      }
    }
  );

  // POST /skills/installed/update - Update a skill to latest or specific version
  fastify.post<{ Body: z.infer<typeof UpdateSkillSchema> }>(
    `${prefix}/skills/installed/update`,
    async (request, reply) => {
      try {
        const userId = getUserIdFromToken(fastify, request);

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { skillId, version } = UpdateSkillSchema.parse(request.body);

        // Check if installed
        if (!getInstalledSkill(userId, skillId)) {
          return reply.code(404).send({ error: 'Skill not installed' });
        }

        // Get skill metadata
        const skill = await skillService.get(skillId);
        if (!skill) {
          return reply.code(404).send({ error: 'Skill not found' });
        }

        // Use specified version or latest
        const updateVersion = version || skill.version;

        // Update skill
        const updated = updateInstalledSkill(userId, skillId, updateVersion);

        if (updated) {
          return {
            message: 'Skill updated successfully',
            skillId,
            version: updateVersion,
            previousVersion: updated.version,
            lastUsed: updated.lastUsed,
          };
        } else {
          return reply.code(500).send({ error: 'Failed to update skill' });
        }
      } catch (error) {
        fastify.log.error('Update skill error:', error);
        return reply.code(500).send({ error: 'Failed to update skill' });
      }
    }
  );

  // GET /skills/installed/:skillId - Get details of an installed skill
  fastify.get<{ Params: { skillId: string } }>(
    `${prefix}/skills/installed/:skillId`,
    async (request, reply) => {
      try {
        const userId = getUserIdFromToken(fastify, request);

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { skillId } = request.params;

        const installed = getInstalledSkill(userId, skillId);
        if (!installed) {
          return reply.code(404).send({ error: 'Skill not installed' });
        }

        // Fetch skill metadata
        const skill = await skillService.get(skillId);
        const skillMetadata = skill ? {
          id: skill.id,
          name: skill.name,
          namespace: skill.namespace,
          description: skill.description,
          author: skill.author,
          version: skill.version,
          latestVersion: skill.version,
          categories: skill.categories,
          keywords: skill.keywords,
        } : null;

        return {
          ...installed,
          skill: skillMetadata,
        };
      } catch (error) {
        fastify.log.error('Get installed skill error:', error);
        return reply.code(500).send({ error: 'Failed to get installed skill' });
      }
    }
  );

  // POST /skills/installed/:skillId/use - Mark skill as used (for statistics)
  fastify.post<{ Params: { skillId: string } }>(
    `${prefix}/skills/installed/:skillId/use`,
    async (request, reply) => {
      try {
        const userId = getUserIdFromToken(fastify, request);

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { skillId } = request.params;

        const skill = getInstalledSkill(userId, skillId);
        if (!skill) {
          return reply.code(404).send({ error: 'Skill not installed' });
        }

        // Update last used timestamp
        skill.lastUsed = new Date().toISOString();

        return {
          message: 'Skill usage recorded',
          skillId,
          lastUsed: skill.lastUsed,
        };
      } catch (error) {
        fastify.log.error('Record skill usage error:', error);
        return reply.code(500).send({ error: 'Failed to record skill usage' });
      }
    }
  );
}