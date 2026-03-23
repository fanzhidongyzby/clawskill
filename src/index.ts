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

// Server
export { createServer, startServer } from './server/index';
export type { ServerOptions } from './server/index';

// Version
export const VERSION = process.env.npm_package_version ?? '0.1.0';