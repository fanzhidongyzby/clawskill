/**
 * ClawSkill - AI Agent Skill Package Manager
 * 主入口文件，整合所有功能模块
 *
 * @packageDocumentation
 */

// Core types
export * from './types/skill';

// Skill URL utilities
export { parseSkillUrl, formatSkillUrl, getSkillId, isValidVersion, compareVersions } from './core/skill-url';

// SKILL.md parser
export { parseSkillMd, extractFrontmatter } from './core/parser';

// Skill service
export { SkillService, InMemorySkillRepository } from './core/skill-service';
export type { SkillRepository } from './core/skill-service';
export { KyselyRepository } from './core/kysely-repository';

// Database
export { createDb, getDb, closeDb } from './core/db';
export type { DbConfig } from './core/db';
export type { Database } from './core/db-types';

// Storage
export { SkillStorage, getStorage } from './core/storage';
export type { SkillPackage, SkillManifest } from './core/storage';

// Server
export { createServer, startServer } from './server/index';
export type { ServerOptions } from './server/index';

// Auth
export { generateApiKey, createApiKey } from './server/middleware/auth';

// ============ Feature Modules ============

// 1. GitHub Source Integration
export { GitHubSource, GitHubSourceConfig } from './github/sources/github-source';
export { SkillMDParser, ParsedSkillMD, SkillMetadata } from './github/parser/skill-md-parser';
export { IndexBuilder, IndexItem } from './github/indexer/index-builder';
export { Syncer, SyncConfig, SyncResult } from './github/syncer/syncer';
export type {
  Source,
  ListOptions,
  SkillInfo,
  SkillDetail,
  VersionInfo,
  SkillMD,
  SourceEvent,
} from './github/types/source';

// 2. Dependency Management
export { DependencyResolver } from './dependency/resolver/dependency-resolver';
export { InstallCommandGenerator } from './dependency/generator/install-command-generator';
export { SkillManager } from './dependency/manager/skill-manager';
export type { SkillInfo as ManagerSkillInfo } from './dependency/manager/skill-manager';
export type {
  Dependency,
  DependencyItem,
  SkillMetadata as DependencyMetadata,
  DependencyTreeNode,
  DependencyConflict,
  ResolutionResult,
  ResolutionOptions,
} from './dependency/types/dependency';
export type { InstallCommand, InstallPlan } from './dependency/generator/install-command-generator';

// 3. Semantic Search
export { VectorIndexer } from './semantic-search/indexer/vector-indexer';
export { EmbeddingClient } from './semantic-search/embedder/embedding-client';
export { SemanticSearcher } from './semantic-search/searcher/semantic-searcher';
export { RankingEngine } from './semantic-search/ranking/ranking-engine';
export { FilterEngine } from './semantic-search/filter/filter-engine';
export type {
  SearchResult,
  VectorDocument,
  SearchOptions,
  SkillData,
  EmbeddingConfig,
} from './semantic-search/types/search';
export type { RankingOptions, SkillStats } from './semantic-search/ranking/ranking-engine';
export type { FilterOptions, SkillDataExtended } from './semantic-search/filter/filter-engine';

// 4. Security Scanner
export { SecurityScanner } from './security/scanner/security-scanner';
export { SecretScanner } from './security/scanner/secret-scanner';
export { DependencyScanner } from './security/scanner/dependency-scanner';
export { SecurityReportGenerator } from './security/report/security-report-generator';
export type {
  SecurityReport,
  SecurityFinding,
  ScanOptions,
  ScanResult,
  Severity,
  FindingType,
} from './security/types/security';

// Version
export const VERSION = process.env.npm_package_version ?? '0.1.0';