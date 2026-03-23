/**
 * Skill API routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { SkillService } from '../core/skill-service';
import type { Skill, SkillListOptions, SkillVersion } from '../types/skill';
import { z } from 'zod';

// Request schemas
const SkillCreateSchema = z.object({
  name: z.string().min(1).max(64),
  namespace: z.string().min(1).max(64),
  description: z.string(),
  author: z.string(),
  license: z.string().default('MIT'),
  version: z.string().default('0.0.1'),
  keywords: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

const VersionCreateSchema = z.object({
  version: z.string(),
  description: z.string(),
  changelog: z.string().optional(),
  installCommands: z.array(z.object({
    platform: z.string(),
    command: z.string(),
  })).optional(),
});

const ListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  query: z.string().optional(),
  category: z.string().optional(),
  sort: z.string().default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

interface SkillRoutesOptions {
  skillService: SkillService;
}

export async function registerSkillRoutes(
  fastify: FastifyInstance,
  options: SkillRoutesOptions
): Promise<void> {
  const { skillService } = options;

  // List skills
  fastify.get('/skills', async (request) => {
    const raw = request.query as Record<string, string>;
    const opts: SkillListOptions = {
      page: parseInt(raw.page ?? '1', 10),
      pageSize: parseInt(raw.pageSize ?? '20', 10),
      query: raw.query,
      category: raw.category,
      sort: raw.sort ?? 'name',
      order: (raw.order as 'asc' | 'desc') ?? 'asc',
    };
    return skillService.list(opts);
  });

  // Create skill
  fastify.post('/skills', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const body = request.body as z.infer<typeof SkillCreateSchema>;
    const skill: Skill = {
      id: `${body.namespace}/${body.name}`,
      name: body.name,
      namespace: body.namespace,
      description: body.description,
      author: body.author,
      license: body.license ?? 'MIT',
      version: body.version ?? '0.0.1',
      keywords: body.keywords ?? [],
      categories: body.categories ?? [],
      downloads: 0,
      stars: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await skillService.create(skill);
    return reply.code(201).send(skill);
  });

  // Get skill by ID
  fastify.get('/skills/:namespace/:name', async (
    request: FastifyRequest<{ Params: { namespace: string; name: string } }>,
    reply: FastifyReply
  ) => {
    const { namespace, name } = request.params;
    const skillId = `${namespace}/${name}`;

    try {
      const skill = await skillService.get(skillId);
      return skill;
    } catch {
      return reply.code(404).send({ error: 'Skill not found' });
    }
  });

  // Update skill
  fastify.put('/skills/:namespace/:name', async (
    request: FastifyRequest<{
      Params: { namespace: string; name: string };
      Body: Partial<Skill>;
    }>,
    reply: FastifyReply
  ) => {
    const { namespace, name } = request.params;
    const skillId = `${namespace}/${name}`;

    try {
      const existing = await skillService.get(skillId);
      const updated: Skill = {
        ...existing,
        ...request.body,
        id: skillId,
        namespace,
        name,
        updatedAt: new Date(),
      };
      await skillService.update(updated);
      return updated;
    } catch {
      return reply.code(404).send({ error: 'Skill not found' });
    }
  });

  // Delete skill
  fastify.delete('/skills/:namespace/:name', async (
    request: FastifyRequest<{ Params: { namespace: string; name: string } }>,
    reply: FastifyReply
  ) => {
    const { namespace, name } = request.params;
    const skillId = `${namespace}/${name}`;

    try {
      await skillService.delete(skillId);
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: 'Skill not found' });
    }
  });

  // List versions
  fastify.get('/skills/:namespace/:name/versions', async (
    request: FastifyRequest<{ Params: { namespace: string; name: string } }>
  ) => {
    const { namespace, name } = request.params;
    const skillId = `${namespace}/${name}`;
    const versions = await skillService.listVersions(skillId);
    return { data: versions };
  });

  // Get version
  fastify.get('/skills/:namespace/:name/versions/:version', async (
    request: FastifyRequest<{ Params: { namespace: string; name: string; version: string } }>,
    reply: FastifyReply
  ) => {
    const { namespace, name, version } = request.params;
    const skillId = `${namespace}/${name}`;

    try {
      const v = await skillService.getVersion(skillId, version);
      return v;
    } catch {
      return reply.code(404).send({ error: 'Version not found' });
    }
  });

  // Publish version
  fastify.post('/skills/:namespace/:name/versions', async (
    request: FastifyRequest<{
      Params: { namespace: string; name: string };
    }>,
    reply: FastifyReply
  ) => {
    const { namespace, name } = request.params;
    const skillId = `${namespace}/${name}`;
    const body = request.body as z.infer<typeof VersionCreateSchema>;

    const version: SkillVersion = {
      skillId,
      version: body.version,
      description: body.description,
      changelog: body.changelog,
      deprecated: false,
      yanked: false,
      publishedAt: new Date(),
      installCommands: body.installCommands ?? [],
    };

    try {
      await skillService.publishVersion(version);
      return reply.code(201).send(version);
    } catch {
      return reply.code(404).send({ error: 'Skill not found' });
    }
  });
}