/**
 * Skill package storage - local filesystem implementation
 */

import { readFile, writeFile, mkdir, rm, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { existsSync } from 'fs';

export interface SkillPackage {
  skillId: string;
  version: string;
  files: Map<string, Buffer>;
  manifest: SkillManifest;
}

export interface SkillManifest {
  id: string;
  version: string;
  files: string[];
  checksum: string;
  size: number;
  createdAt: Date;
}

const STORAGE_ROOT = process.env.CLAWSKILL_STORAGE ?? '/data/clawskill/storage';

export class SkillStorage {
  private root: string;

  constructor(root: string = STORAGE_ROOT) {
    this.root = root;
  }

  async init(): Promise<void> {
    await mkdir(this.root, { recursive: true });
  }

  async store(skillId: string, version: string, files: Map<string, Buffer>): Promise<SkillManifest> {
    const dir = this.getSkillDir(skillId, version);
    await mkdir(dir, { recursive: true });

    const filePaths: string[] = [];
    let totalSize = 0;
    const hashes: string[] = [];

    for (const [path, content] of files) {
      const fullPath = join(dir, path);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, content);

      filePaths.push(path);
      totalSize += content.length;
      hashes.push(createHash('sha256').update(content).digest('hex'));
    }

    // Create manifest
    const checksum = createHash('sha256').update(hashes.join(':')).digest('hex');
    const manifest: SkillManifest = {
      id: skillId,
      version,
      files: filePaths,
      checksum,
      size: totalSize,
      createdAt: new Date(),
    };

    await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    return manifest;
  }

  async retrieve(skillId: string, version: string): Promise<SkillPackage | null> {
    const dir = this.getSkillDir(skillId, version);
    if (!existsSync(dir)) return null;

    const manifestPath = join(dir, 'manifest.json');
    if (!existsSync(manifestPath)) return null;

    const manifest: SkillManifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    const files = new Map<string, Buffer>();

    for (const path of manifest.files) {
      const content = await readFile(join(dir, path));
      files.set(path, content);
    }

    return { skillId, version, files, manifest };
  }

  async delete(skillId: string, version?: string): Promise<boolean> {
    const dir = version
      ? this.getSkillDir(skillId, version)
      : join(this.root, skillId.replace('/', '-'));

    if (!existsSync(dir)) return false;

    await rm(dir, { recursive: true });
    return true;
  }

  async listVersions(skillId: string): Promise<string[]> {
    const dir = join(this.root, skillId.replace('/', '-'));
    if (!existsSync(dir)) return [];

    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory())
      .map(e => e.name);
  }

  async getFile(skillId: string, version: string, path: string): Promise<Buffer | null> {
    const fullPath = join(this.getSkillDir(skillId, version), path);
    if (!existsSync(fullPath)) return null;
    return readFile(fullPath);
  }

  private getSkillDir(skillId: string, version: string): string {
    return join(this.root, skillId.replace('/', '-'), version);
  }
}

// Singleton
let storage: SkillStorage | null = null;

export function getStorage(): SkillStorage {
  if (!storage) {
    storage = new SkillStorage();
  }
  return storage;
}