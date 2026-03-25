/**
 * CLI storage utilities for local skill installation
 */

import { readFile, writeFile, readdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';

export interface InstalledSkill {
  id: string;
  namespace: string;
  name: string;
  version: string;
  installedAt: string;
  path: string;
}

const CONFIG_DIR = process.env.HOME ? join(process.env.HOME, '.clawskill') : '/tmp/.clawskill';
const SKILLS_CONFIG = join(CONFIG_DIR, 'installed-skills.json');

/**
 * Ensure config directory exists
 */
async function ensureConfigDir() {
  try {
    await access(CONFIG_DIR);
  } catch {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Get all installed skills
 */
export async function getInstalledSkills(): Promise<InstalledSkill[]> {
  await ensureConfigDir();

  try {
    await access(SKILLS_CONFIG);
    const content = await readFile(SKILLS_CONFIG, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * Save installed skills
 */
async function saveInstalledSkills(skills: InstalledSkill[]) {
  await ensureConfigDir();
  await writeFile(SKILLS_CONFIG, JSON.stringify(skills, null, 2), 'utf-8');
}

/**
 * Add a skill to installed list
 */
export async function addInstalledSkill(skill: InstalledSkill) {
  const skills = await getInstalledSkills();
  skills.push(skill);
  await saveInstalledSkills(skills);
}

/**
 * Remove a skill from installed list
 */
export async function removeInstalledSkill(skillId: string) {
  const skills = await getInstalledSkills();
  const filtered = skills.filter(s => s.id !== skillId);
  await saveInstalledSkills(filtered);
}

/**
 * Get skill by ID
 */
export async function getInstalledSkill(skillId: string): Promise<InstalledSkill | undefined> {
  const skills = await getInstalledSkills();
  return skills.find(s => s.id === skillId);
}

/**
 * Check if skill is installed
 */
export async function isSkillInstalled(skillId: string): Promise<boolean> {
  const skill = await getInstalledSkill(skillId);
  return skill !== undefined;
}