/**
 * ClawSkill - AI Agent Skill Package Manager
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

// Version
export const VERSION = process.env.npm_package_version ?? '0.1.0';