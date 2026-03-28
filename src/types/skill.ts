/**
 * Core skill types for ClawSkill
 */

export interface Skill {
  id: string;
  name: string;
  namespace: string;
  description: string;
  author: string;
  license: string;
  version: string;
  keywords: string[];
  categories: string[];
  homepage?: string;
  repository?: string;
  downloads: number;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
  
  // CLI-Anything extended fields
  source?: string;
  category?: string;
  installCmd?: string;
  entryPoint?: string;
  skillMdPath?: string;
  requires?: string;
}

export interface SkillSearchResult {
  url: string;
  name: string;
  description: string;
  version: string;
  category?: string;
  source?: string;
}

export interface InstallResult {
  success: boolean;
  message: string;
  path?: string;
  error?: string;
}

/**
 * Skill Source interface for pluggable skill sources
 */
export interface SkillSource {
  name: string;
  displayName: string;
  description: string;
  
  search(query: string): Promise<SkillSearchResult[]>;
  getSkill(skillUrl: string): Promise<Skill>;
  install(skillUrl: string): Promise<InstallResult>;
}

export interface SkillDetail extends Skill {
  latestVersion: string;
  currentVersion?: SkillVersion;
  installCommands: InstallCommand[];
  readme?: string;
  skillMd?: string;
}

export interface SkillVersion {
  skillId: string;
  version: string;
  description: string;
  changelog?: string;
  deprecated: boolean;
  yanked: boolean;
  publishedAt: Date;
  installCommands: InstallCommand[];
}

export interface InstallCommand {
  platform: string;
  command: string;
}

export interface SkillListOptions {
  page: number;
  pageSize: number;
  query?: string;
  category?: string;
  license?: string;
  sort: string;
  order: 'asc' | 'desc';
}

export interface SearchResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface SkillUrl {
  namespace: string;
  name: string;
  version?: string;
}

export interface ParsedSkillMd {
  id: string;
  name: string;
  namespace: string;
  version: string;
  description: string;
  author: string;
  license: string;
  keywords: string[];
  categories: string[];
  installCommands: InstallCommand[];
  content: string;
}

// Error types
export class SkillError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'SkillError';
  }
}

export const SkillNotFound = new SkillError('Skill not found', 'SKILL_NOT_FOUND', 404);
export const VersionNotFound = new SkillError('Version not found', 'VERSION_NOT_FOUND', 404);
export const SkillAlreadyExists = new SkillError('Skill already exists', 'SKILL_EXISTS', 409);
export const VersionAlreadyExists = new SkillError('Version already exists', 'VERSION_EXISTS', 409);
export const InvalidSkillUrl = new SkillError('Invalid skill URL', 'INVALID_URL', 400);