/**
 * Kysely-based Skill Repository implementation
 */

import type { Skill, SkillDetail, SkillVersion, SkillListOptions, SearchResult, InstallCommand } from '../types/skill';
import type { SkillRepository } from './skill-service';
import type { Kysely } from 'kysely';
import type { Database } from './db-types';
import { getDb } from './db';
import { SkillNotFound } from '../types/skill';

export class KyselyRepository implements SkillRepository {
  private db: Kysely<Database>;

  constructor(db?: Kysely<Database>) {
    this.db = db ?? getDb();
  }

  async getSkill(id: string): Promise<Skill | null> {
    const row = await this.db
      .selectFrom('skills')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;
    return this.rowToSkill(row);
  }

  async getSkillDetail(id: string): Promise<SkillDetail | null> {
    const skill = await this.getSkill(id);
    if (!skill) return null;

    const latestVersion = await this.getLatestVersion(id);
    const installCommands = latestVersion?.installCommands ?? [];

    return {
      ...skill,
      latestVersion: latestVersion?.version ?? skill.version,
      installCommands,
    };
  }

  async createSkill(skill: Skill): Promise<void> {
    await this.db
      .insertInto('skills')
      .values({
        id: skill.id,
        name: skill.name,
        namespace: skill.namespace,
        description: skill.description,
        author: skill.author,
        license: skill.license,
        latest_version: skill.version,
        keywords: skill.keywords,
        categories: skill.categories,
        homepage: skill.homepage ?? null,
        repository: skill.repository ?? null,
        downloads: 0,
        stars: 0,
      })
      .execute();
  }

  async updateSkill(skill: Skill): Promise<void> {
    const result = await this.db
      .updateTable('skills')
      .set({
        name: skill.name,
        description: skill.description,
        author: skill.author,
        license: skill.license,
        latest_version: skill.version,
        keywords: skill.keywords,
        categories: skill.categories,
        homepage: skill.homepage ?? null,
        repository: skill.repository ?? null,
        updated_at: new Date(),
      })
      .where('id', '=', skill.id)
      .executeTakeFirst();

    if (Number(result.numUpdatedRows) === 0) {
      throw SkillNotFound;
    }
  }

  async deleteSkill(id: string): Promise<void> {
    // Delete versions first (cascade would handle this in production)
    await this.db
      .deleteFrom('install_commands')
      .where('version_id', 'in',
        this.db.selectFrom('versions').select('id').where('skill_id', '=', id)
      )
      .execute();

    await this.db.deleteFrom('versions').where('skill_id', '=', id).execute();

    const result = await this.db.deleteFrom('skills').where('id', '=', id).executeTakeFirst();

    if (Number(result.numDeletedRows) === 0) {
      throw SkillNotFound;
    }
  }

  async listSkills(options: SkillListOptions): Promise<SearchResult<Skill>> {
    let query = this.db.selectFrom('skills').selectAll();

    // Filter by query
    if (options.query) {
      query = query.where(eb =>
        eb('name', 'ilike', `%${options.query}%`)
          .or('description', 'ilike', `%${options.query}%`)
      );
    }

    // Filter by category
    if (options.category) {
      query = query.where('categories', '@>', [options.category]);
    }

    // Count total
    const { count } = await this.db
      .selectFrom('skills')
      .select(eb => eb.fn.countAll().as('count'))
      .where('name', 'ilike', options.query ? `%${options.query}%` : '%')
      .executeTakeFirst() as { count: string };

    const total = parseInt(count, 10);

    // Sort
    const sortColumn = options.sort as keyof Database['skills'];
    query = query.orderBy(sortColumn, options.order);

    // Paginate
    const offset = (options.page - 1) * options.pageSize;
    const rows = await query.limit(options.pageSize).offset(offset).execute();

    return {
      data: rows.map(r => this.rowToSkill(r)),
      meta: {
        total,
        page: options.page,
        pageSize: options.pageSize,
        totalPages: Math.ceil(total / options.pageSize),
      },
    };
  }

  async getVersion(skillId: string, version: string): Promise<SkillVersion | null> {
    const row = await this.db
      .selectFrom('versions')
      .selectAll()
      .where('skill_id', '=', skillId)
      .where('version', '=', version)
      .executeTakeFirst();

    if (!row) return null;
    return this.rowToVersion(row);
  }

  async getLatestVersion(skillId: string): Promise<SkillVersion | null> {
    const row = await this.db
      .selectFrom('versions')
      .selectAll()
      .where('skill_id', '=', skillId)
      .where('deprecated', '=', false)
      .where('yanked', '=', false)
      .orderBy('published_at', 'desc')
      .executeTakeFirst();

    if (!row) return null;
    return this.rowToVersion(row);
  }

  async listVersions(skillId: string): Promise<SkillVersion[]> {
    const rows = await this.db
      .selectFrom('versions')
      .selectAll()
      .where('skill_id', '=', skillId)
      .orderBy('published_at', 'desc')
      .execute();

    return rows.map(r => this.rowToVersion(r));
  }

  async createVersion(version: SkillVersion): Promise<void> {
    const versionId = `${version.skillId}@${version.version}`;
    await this.db
      .insertInto('versions')
      .values({
        id: versionId,
        skill_id: version.skillId,
        version: version.version,
        description: version.description,
        changelog: version.changelog ?? null,
        deprecated: version.deprecated,
        yanked: version.yanked,
        install_commands: JSON.stringify(version.installCommands),
      })
      .execute();
  }

  private rowToSkill(row: {
    id: string;
    name: string;
    namespace: string;
    description: string;
    author: string;
    license: string;
    latest_version: string | null;
    keywords: string[];
    categories: string[];
    homepage: string | null;
    repository: string | null;
    downloads: number;
    stars: number;
    created_at: Date;
    updated_at: Date;
  }): Skill {
    return {
      id: row.id,
      name: row.name,
      namespace: row.namespace,
      description: row.description,
      author: row.author,
      license: row.license,
      version: row.latest_version ?? '',
      keywords: row.keywords ?? [],
      categories: row.categories ?? [],
      homepage: row.homepage ?? undefined,
      repository: row.repository ?? undefined,
      downloads: row.downloads,
      stars: row.stars,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private rowToVersion(row: {
    id: number;
    skill_id: string;
    version: string;
    description: string;
    changelog: string | null;
    deprecated: boolean;
    yanked: boolean;
    published_at: Date;
    install_commands: string | null;
  }): SkillVersion {
    let installCommands: InstallCommand[] = [];
    if (row.install_commands) {
      try {
        installCommands = JSON.parse(row.install_commands);
      } catch {
        installCommands = [];
      }
    }

    return {
      skillId: row.skill_id,
      version: row.version,
      description: row.description,
      changelog: row.changelog ?? undefined,
      deprecated: row.deprecated,
      yanked: row.yanked,
      publishedAt: row.published_at,
      installCommands,
    };
  }
}