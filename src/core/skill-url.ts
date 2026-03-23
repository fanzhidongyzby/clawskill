/**
 * Skill URL parsing and validation
 */

import { z } from 'zod';
import type { SkillUrl } from '../types/skill';
import { InvalidSkillUrl } from '../types/skill';

const SkillUrlSchema = z.object({
  namespace: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/).optional(),
});

/**
 * Parse a skill URL string
 * Formats:
 * - namespace/name
 * - namespace/name@version
 * - https://clawskill.com/skill/namespace/name
 * - https://clawskill.com/skill/namespace/name@version
 */
export function parseSkillUrl(url: string): SkillUrl {
  let skillPart = url;

  // Handle full URL format
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/^\/skill\/([^/]+\/[^/@]+)(?:@([^/]+))?$/);
    if (!pathMatch) {
      throw InvalidSkillUrl;
    }
    skillPart = pathMatch[1] + (pathMatch[2] ? `@${pathMatch[2]}` : '');
  }

  // Parse namespace/name[@version]
  const match = skillPart.match(/^([^/@]+)\/([^/@]+)(?:@(.+))?$/);
  if (!match) {
    throw InvalidSkillUrl;
  }

  const [, namespace, name, version] = match;

  const result = SkillUrlSchema.safeParse({ namespace, name, version });
  if (!result.success) {
    throw InvalidSkillUrl;
  }

  return {
    namespace: result.data.namespace,
    name: result.data.name,
    version: result.data.version,
  };
}

/**
 * Format a skill URL to string
 */
export function formatSkillUrl(skill: SkillUrl): string {
  let url = `${skill.namespace}/${skill.name}`;
  if (skill.version) {
    url += `@${skill.version}`;
  }
  return url;
}

/**
 * Get the full skill ID (namespace/name)
 */
export function getSkillId(skill: SkillUrl): string {
  return `${skill.namespace}/${skill.name}`;
}

/**
 * Validate a version string
 */
export function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(version);
}

/**
 * Compare two semantic versions
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const parseVersion = (v: string) => {
    const [main] = v.split('-');
    return main!.split('.').map(Number);
  };

  const partsA = parseVersion(a);
  const partsB = parseVersion(b);

  for (let i = 0; i < 3; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}