/**
 * Kysely database types for ClawSkill
 */

import type { Generated } from 'kysely';

export interface SkillsTable {
  id: string;
  name: string;
  namespace: string;
  description: string;
  author: string;
  license: string;
  version: string;
  keywords: string[]; // JSONB array
  categories: string[]; // JSONB array
  homepage: string | null;
  repository: string | null;
  downloads: Generated<number>;
  stars: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface VersionsTable {
  id: Generated<number>;
  skill_id: string;
  version: string;
  description: string;
  changelog: string | null;
  deprecated: Generated<boolean>;
  yanked: Generated<boolean>;
  published_at: Generated<Date>;
  install_commands: string | null; // JSON
}

export interface InstallCommandsTable {
  id: Generated<number>;
  version_id: number;
  platform: string;
  command: string;
}

export interface ApiKeysTable {
  id: Generated<number>;
  key: string;
  name: string;
  user_id: string | null;
  scopes: string[]; // JSONB array
  created_at: Generated<Date>;
  expires_at: Date | null;
  last_used_at: Date | null;
}

export interface Database {
  skills: SkillsTable;
  versions: VersionsTable;
  install_commands: InstallCommandsTable;
  api_keys: ApiKeysTable;
}