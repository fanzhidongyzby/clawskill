import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SkillStorage } from './storage';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('SkillStorage', () => {
  let storage: SkillStorage;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'clawskill-test-'));
    storage = new SkillStorage(tempDir);
    await storage.init();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it('stores and retrieves a package', async () => {
    const files = new Map<string, Buffer>();
    files.set('SKILL.md', Buffer.from('# Test Skill'));
    files.set('src/index.ts', Buffer.from('export default {}'));

    const manifest = await storage.store('test/skill', '1.0.0', files);
    expect(manifest.files).toHaveLength(2);
    expect(manifest.size).toBeGreaterThan(0);
    expect(manifest.checksum).toBeTruthy();

    const pkg = await storage.retrieve('test/skill', '1.0.0');
    expect(pkg).not.toBeNull();
    expect(pkg!.files.size).toBe(2);
    expect(pkg!.files.get('SKILL.md')!.toString()).toBe('# Test Skill');
  });

  it('returns null for missing package', async () => {
    const pkg = await storage.retrieve('nonexistent/skill', '1.0.0');
    expect(pkg).toBeNull();
  });

  it('deletes a package version', async () => {
    const files = new Map<string, Buffer>();
    files.set('SKILL.md', Buffer.from('# Test'));
    await storage.store('test/skill', '1.0.0', files);

    const deleted = await storage.delete('test/skill', '1.0.0');
    expect(deleted).toBe(true);

    const pkg = await storage.retrieve('test/skill', '1.0.0');
    expect(pkg).toBeNull();
  });

  it('returns false when deleting nonexistent package', async () => {
    const deleted = await storage.delete('nonexistent/skill', '1.0.0');
    expect(deleted).toBe(false);
  });

  it('lists versions', async () => {
    const files = new Map<string, Buffer>();
    files.set('SKILL.md', Buffer.from('# Test'));

    await storage.store('test/skill', '1.0.0', files);
    await storage.store('test/skill', '2.0.0', files);

    const versions = await storage.listVersions('test/skill');
    expect(versions).toHaveLength(2);
    expect(versions).toContain('1.0.0');
    expect(versions).toContain('2.0.0');
  });

  it('gets individual file', async () => {
    const files = new Map<string, Buffer>();
    files.set('SKILL.md', Buffer.from('# Hello'));
    await storage.store('test/skill', '1.0.0', files);

    const content = await storage.getFile('test/skill', '1.0.0', 'SKILL.md');
    expect(content).not.toBeNull();
    expect(content!.toString()).toBe('# Hello');
  });

  it('returns null for missing file', async () => {
    const content = await storage.getFile('test/skill', '1.0.0', 'nonexistent');
    expect(content).toBeNull();
  });
});
