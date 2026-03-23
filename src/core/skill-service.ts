/**
 * Skill Service - Core business logic for skill management
 */

import type {
  Skill,
  SkillDetail,
  SkillVersion,
  SkillListOptions,
  SearchResult,
} from '../types/skill';
import { SkillNotFound, VersionNotFound, SkillAlreadyExists } from '../types/skill';

/**
 * Repository interface for skill persistence
 */
export interface SkillRepository {
  getSkill(id: string): Promise<Skill | null>;
  getSkillDetail(id: string): Promise<SkillDetail | null>;
  createSkill(skill: Skill): Promise<void>;
  updateSkill(skill: Skill): Promise<void>;
  deleteSkill(id: string): Promise<void>;
  listSkills(options: SkillListOptions): Promise<SearchResult<Skill>>;
  getVersion(skillId: string, version: string): Promise<SkillVersion | null>;
  getLatestVersion(skillId: string): Promise<SkillVersion | null>;
  listVersions(skillId: string): Promise<SkillVersion[]>;
  createVersion(version: SkillVersion): Promise<void>;
}

/**
 * In-memory repository for testing and development
 */
export class InMemorySkillRepository implements SkillRepository {
  private skills = new Map<string, Skill>();
  private skillDetails = new Map<string, SkillDetail>();
  private versions = new Map<string, SkillVersion[]>();

  async getSkill(id: string): Promise<Skill | null> {
    return this.skills.get(id) ?? null;
  }

  async getSkillDetail(id: string): Promise<SkillDetail | null> {
    const detail = this.skillDetails.get(id);
    if (!detail) return null;

    // Attach latest version info
    const versions = await this.listVersions(id);
    if (versions.length > 0) {
      detail.latestVersion = versions[0]!.version;
    }

    return detail;
  }

  async createSkill(skill: Skill): Promise<void> {
    if (this.skills.has(skill.id)) {
      throw SkillAlreadyExists;
    }
    this.skills.set(skill.id, skill);
    this.skillDetails.set(skill.id, { ...skill, latestVersion: skill.version, installCommands: [] });
    this.versions.set(skill.id, []);
  }

  async updateSkill(skill: Skill): Promise<void> {
    if (!this.skills.has(skill.id)) {
      throw SkillNotFound;
    }
    this.skills.set(skill.id, skill);
  }

  async deleteSkill(id: string): Promise<void> {
    if (!this.skills.has(id)) {
      throw SkillNotFound;
    }
    this.skills.delete(id);
    this.skillDetails.delete(id);
    this.versions.delete(id);
  }

  async listSkills(options: SkillListOptions): Promise<SearchResult<Skill>> {
    let skills = Array.from(this.skills.values());

    // Filter by query
    if (options.query) {
      const query = options.query.toLowerCase();
      skills = skills.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      );
    }

    // Sort
    skills.sort((a, b) => {
      const aVal = a[options.sort as keyof Skill];
      const bVal = b[options.sort as keyof Skill];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return options.order === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return options.order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    // Paginate
    const total = skills.length;
    const start = (options.page - 1) * options.pageSize;
    const data = skills.slice(start, start + options.pageSize);

    return {
      data,
      meta: {
        total,
        page: options.page,
        pageSize: options.pageSize,
        totalPages: Math.ceil(total / options.pageSize),
      },
    };
  }

  async getVersion(skillId: string, version: string): Promise<SkillVersion | null> {
    const versions = this.versions.get(skillId) ?? [];
    return versions.find(v => v.version === version) ?? null;
  }

  async getLatestVersion(skillId: string): Promise<SkillVersion | null> {
    const versions = this.versions.get(skillId) ?? [];
    const active = versions.filter(v => !v.deprecated && !v.yanked);
    return active[0] ?? null;
  }

  async listVersions(skillId: string): Promise<SkillVersion[]> {
    return this.versions.get(skillId) ?? [];
  }

  async createVersion(version: SkillVersion): Promise<void> {
    const versions = this.versions.get(version.skillId) ?? [];
    versions.unshift(version);
    this.versions.set(version.skillId, versions);
  }
}

/**
 * Skill Service
 */
export class SkillService {
  constructor(private repo: SkillRepository = new InMemorySkillRepository()) {}

  async get(id: string): Promise<SkillDetail> {
    const skill = await this.repo.getSkillDetail(id);
    if (!skill) throw SkillNotFound;
    return skill;
  }

  async list(options: SkillListOptions): Promise<SearchResult<Skill>> {
    return this.repo.listSkills(options);
  }

  async create(skill: Skill): Promise<Skill> {
    await this.repo.createSkill(skill);
    return skill;
  }

  async update(skill: Skill): Promise<Skill> {
    await this.repo.updateSkill(skill);
    return skill;
  }

  async delete(id: string): Promise<void> {
    await this.repo.deleteSkill(id);
  }

  async getVersion(skillId: string, version: string): Promise<SkillVersion> {
    const v = await this.repo.getVersion(skillId, version);
    if (!v) throw VersionNotFound;
    return v;
  }

  async getLatestVersion(skillId: string): Promise<SkillVersion> {
    const v = await this.repo.getLatestVersion(skillId);
    if (!v) throw VersionNotFound;
    return v;
  }

  async listVersions(skillId: string): Promise<SkillVersion[]> {
    return this.repo.listVersions(skillId);
  }

  async publishVersion(version: SkillVersion): Promise<SkillVersion> {
    const skill = await this.repo.getSkill(version.skillId);
    if (!skill) throw SkillNotFound;
    await this.repo.createVersion(version);
    return version;
  }
}