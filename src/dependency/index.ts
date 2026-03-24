/**
 * ClawSkill Skill Service - 主入口
 */
export { DependencyResolver } from './resolver/dependency-resolver';
export { InstallCommandGenerator } from './generator/install-command-generator';
export { SkillManager } from './manager/skill-manager';

export type {
  Dependency,
  DependencyItem,
  SkillMetadata,
  DependencyTreeNode,
  DependencyConflict,
  ResolutionResult,
  ResolutionOptions,
} from './types/dependency';

export type {
  SkillInfo,
} from './manager/skill-manager';

export type {
  InstallCommand,
  InstallPlan,
} from './generator/install-command-generator';