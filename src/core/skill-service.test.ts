import { describe, it, expect, beforeEach } from 'vitest';
import { SkillService, InMemorySkillRepository } from './skill-service';
import type { Skill, SkillVersion } from '../types/skill';

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: 'test/weather',
    name: 'weather',
    namespace: 'test',
    description: 'Weather skill',
    author: 'dev',
    license: 'MIT',
    version: '1.0.0',
    keywords: ['weather'],
    categories: ['utility'],
    downloads: 0,
    stars: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeVersion(overrides: Partial<SkillVersion> = {}): SkillVersion {
  return {
    skillId: 'test/weather',
    version: '1.0.0',
    description: 'Initial release',
    deprecated: false,
    yanked: false,
    publishedAt: new Date(),
    installCommands: [],
    ...overrides,
  };
}

describe('SkillService', () => {
  let service: SkillService;

  beforeEach(() => {
    service = new SkillService(new InMemorySkillRepository());
  });

  describe('create', () => {
    it('creates a skill', async () => {
      const skill = makeSkill();
      const result = await service.create(skill);
      expect(result.id).toBe('test/weather');
    });

    it('throws on duplicate', async () => {
      await service.create(makeSkill());
      await expect(service.create(makeSkill())).rejects.toThrow('already exists');
    });
  });

  describe('get', () => {
    it('gets an existing skill', async () => {
      await service.create(makeSkill());
      const result = await service.get('test/weather');
      expect(result.name).toBe('weather');
    });

    it('throws for missing skill', async () => {
      await expect(service.get('nonexistent/skill')).rejects.toThrow('not found');
    });
  });

  describe('list', () => {
    it('lists all skills', async () => {
      await service.create(makeSkill({ id: 'a/one', name: 'one', namespace: 'a' }));
      await service.create(makeSkill({ id: 'b/two', name: 'two', namespace: 'b' }));
      const result = await service.list({ page: 1, pageSize: 10, sort: 'name', order: 'asc' });
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('filters by query', async () => {
      await service.create(makeSkill({ id: 'a/weather', name: 'weather', description: 'Get weather' }));
      await service.create(makeSkill({ id: 'b/calendar', name: 'calendar', description: 'Manage calendar' }));
      const result = await service.list({ page: 1, pageSize: 10, query: 'weather', sort: 'name', order: 'asc' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.name).toBe('weather');
    });

    it('paginates', async () => {
      for (let i = 0; i < 5; i++) {
        await service.create(makeSkill({ id: `t/s${i}`, name: `s${i}`, namespace: 't' }));
      }
      const page1 = await service.list({ page: 1, pageSize: 2, sort: 'name', order: 'asc' });
      expect(page1.data).toHaveLength(2);
      expect(page1.meta.totalPages).toBe(3);
    });
  });

  describe('update', () => {
    it('updates a skill', async () => {
      await service.create(makeSkill());
      const updated = makeSkill({ description: 'Updated' });
      const result = await service.update(updated);
      expect(result.description).toBe('Updated');
    });

    it('throws for missing skill', async () => {
      await expect(service.update(makeSkill())).rejects.toThrow('not found');
    });
  });

  describe('delete', () => {
    it('deletes a skill', async () => {
      await service.create(makeSkill());
      await service.delete('test/weather');
      await expect(service.get('test/weather')).rejects.toThrow('not found');
    });

    it('throws for missing skill', async () => {
      await expect(service.delete('nonexistent/skill')).rejects.toThrow('not found');
    });
  });

  describe('versions', () => {
    it('publishes a version', async () => {
      await service.create(makeSkill());
      const version = makeVersion();
      const result = await service.publishVersion(version);
      expect(result.version).toBe('1.0.0');
    });

    it('throws publishing to nonexistent skill', async () => {
      await expect(service.publishVersion(makeVersion())).rejects.toThrow('not found');
    });

    it('gets a version', async () => {
      await service.create(makeSkill());
      await service.publishVersion(makeVersion());
      const result = await service.getVersion('test/weather', '1.0.0');
      expect(result.version).toBe('1.0.0');
    });

    it('throws for missing version', async () => {
      await service.create(makeSkill());
      await expect(service.getVersion('test/weather', '9.9.9')).rejects.toThrow('not found');
    });

    it('lists versions', async () => {
      await service.create(makeSkill());
      await service.publishVersion(makeVersion({ version: '1.0.0' }));
      await service.publishVersion(makeVersion({ version: '2.0.0' }));
      const versions = await service.listVersions('test/weather');
      expect(versions).toHaveLength(2);
    });

    it('gets latest version', async () => {
      await service.create(makeSkill());
      await service.publishVersion(makeVersion({ version: '1.0.0' }));
      await service.publishVersion(makeVersion({ version: '2.0.0' }));
      const latest = await service.getLatestVersion('test/weather');
      expect(latest.version).toBe('2.0.0');
    });
  });
});

describe('InMemorySkillRepository', () => {
  it('returns null for missing skill', async () => {
    const repo = new InMemorySkillRepository();
    expect(await repo.getSkill('nonexistent')).toBeNull();
  });

  it('returns null for missing detail', async () => {
    const repo = new InMemorySkillRepository();
    expect(await repo.getSkillDetail('nonexistent')).toBeNull();
  });

  it('returns null for missing latest version', async () => {
    const repo = new InMemorySkillRepository();
    expect(await repo.getLatestVersion('nonexistent')).toBeNull();
  });
});
