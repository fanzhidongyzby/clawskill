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
  security_score: number;
  security_details: string | null; // JSON
  last_security_scan_at: Date | null;
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

// GitHub Source Integration
export interface GitHubSourcesTable {
  id: Generated<number>;
  owner: string;
  repo: string;
  skill_id: string;
  stars: number;
  language: string;
  topics: string[]; // JSONB array
  last_synced_at: Generated<Date>;
  is_active: boolean;
}

// Semantic Search
export interface EmbeddingsTable {
  id: Generated<number>;
  skill_id: string;
  version: string;
  content_type: string; // 'description', 'readme', 'skill_md'
  content_text: string;
  vector: number[]; // Array of floats
  model_name: string;
  created_at: Generated<Date>;
}

export interface SearchHistoryTable {
  id: Generated<number>;
  query: string;
  user_id: string | null;
  results_count: number;
  filters: string | null; // JSON
  created_at: Generated<Date>;
}

// Security Scanner
export interface SecurityScansTable {
  id: Generated<number>;
  skill_id: string;
  version: string;
  scan_type: string; // 'secret', 'dependency', 'full'
  status: string; // 'pending', 'running', 'completed', 'failed'
  findings: string | null; // JSON
  severity_counts: string | null; // JSON
  started_at: Generated<Date>;
  completed_at: Date | null;
}

export interface SecurityFindingsTable {
  id: Generated<number>;
  scan_id: number;
  type: string; // 'secret', 'vulnerability', 'malicious_code'
  severity: string; // 'critical', 'high', 'medium', 'low'
  file_path: string;
  line_number: number;
  description: string;
  remediation: string | null;
}

// Download Stats
export interface SkillDownloadsTable {
  id: string;
  skill_id: string;
  version: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  downloaded_at: Generated<Date>;
}

// Ratings
export interface SkillRatingsTable {
  id: string;
  skill_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Database {
  skills: SkillsTable;
  versions: VersionsTable;
  install_commands: InstallCommandsTable;
  api_keys: ApiKeysTable;
  github_sources: GitHubSourcesTable;
  embeddings: EmbeddingsTable;
  search_history: SearchHistoryTable;
  security_scans: SecurityScansTable;
  security_findings: SecurityFindingsTable;
  skill_downloads: SkillDownloadsTable;
  skill_ratings: SkillRatingsTable;
}