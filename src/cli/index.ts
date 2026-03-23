/**
 * ClawSkill CLI - Complete implementation
 */

import { Command } from 'commander';
import { createServer } from '../server/index';
import { SkillService } from '../core/skill-service';
import { KyselyRepository } from '../core/kysely-repository';
import { parseSkillUrl, formatSkillUrl } from '../core/skill-url';
import { parseSkillMd } from '../core/parser';
import { getStorage } from '../core/storage';
import { createApiKey, generateApiKey } from '../server/middleware/auth';
import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';

const VERSION = process.env.npm_package_version ?? '0.1.0';

const program = new Command();

program
  .name('clawskill')
  .description('AI Agent Skill Package Manager')
  .version(VERSION);

// Helper to get service with DB
function getService(): SkillService {
  return new SkillService(new KyselyRepository());
}

// ====================
// Search command
// ====================
program
  .command('search <query>')
  .description('Search for skills')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-s, --size <number>', 'Page size', '20')
  .action(async (query: string, options: { page: string; size: string }) => {
    const service = getService();
    const result = await service.list({
      query,
      page: parseInt(options.page, 10),
      pageSize: parseInt(options.size, 10),
      sort: 'downloads',
      order: 'desc',
    });

    if (result.data.length === 0) {
      console.log('No skills found.');
      return;
    }

    console.log(`\nFound ${result.meta.total} skills:\n`);
    console.log('NAME'.padEnd(30), 'DESCRIPTION'.padEnd(50), 'DOWNLOADS');
    console.log('-'.repeat(90));

    for (const skill of result.data) {
      const id = formatSkillUrl({ namespace: skill.namespace, name: skill.name });
      const desc = skill.description.slice(0, 47) + (skill.description.length > 47 ? '...' : '');
      console.log(id.padEnd(30), desc.padEnd(50), skill.downloads.toString());
    }

    if (result.meta.totalPages > 1) {
      console.log(`\nPage ${result.meta.page} of ${result.meta.totalPages}. Use --page to see more.`);
    }
  });

// ====================
// Show/Info command
// ====================
program
  .command('show <skill>')
  .alias('info')
  .description('Show skill details')
  .action(async (skillId: string) => {
    const service = getService();
    const url = parseSkillUrl(skillId);

    try {
      const skill = await service.get(formatSkillUrl(url));
      console.log('\n' + '='.repeat(60));
      console.log(`  ${skill.namespace}/${skill.name}`);
      console.log('='.repeat(60));
      console.log(`  Version:     ${skill.latestVersion}`);
      console.log(`  Description: ${skill.description}`);
      console.log(`  Author:      ${skill.author}`);
      console.log(`  License:     ${skill.license}`);
      console.log(`  Downloads:   ${skill.downloads}`);
      console.log(`  Stars:       ${skill.stars}`);
      if (skill.keywords.length > 0) {
        console.log(`  Keywords:    ${skill.keywords.join(', ')}`);
      }
      if (skill.installCommands.length > 0) {
        console.log('\n  Install Commands:');
        for (const cmd of skill.installCommands) {
          console.log(`    [${cmd.platform}] ${cmd.command}`);
        }
      }
      console.log('');
    } catch {
      console.error(`Skill not found: ${skillId}`);
      process.exit(1);
    }
  });

// ====================
// List command
// ====================
program
  .command('list')
  .description('List skills')
  .option('-a, --all', 'List all available skills from registry')
  .action(async (options: { all?: boolean }) => {
    const service = getService();

    if (options.all) {
      const result = await service.list({
        page: 1,
        pageSize: 50,
        sort: 'downloads',
        order: 'desc',
      });

      console.log(`\nAvailable skills (${result.meta.total} total):\n`);
      for (const skill of result.data) {
        const id = `${skill.namespace}/${skill.name}`;
        console.log(`  ${id.padEnd(30)} ${skill.description.slice(0, 40)}`);
      }
    } else {
      console.log('\nInstalled skills: (not implemented)');
      console.log('Use --all to list available skills from registry.');
    }
  });

// ====================
// Install command
// ====================
program
  .command('install <skill>')
  .description('Install a skill')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action(async (skillId: string, options: { dir: string }) => {
    const service = getService();
    const storage = getStorage();
    const url = parseSkillUrl(skillId);
    const id = formatSkillUrl(url);

    try {
      const skill = await service.get(id);
      const version = url.version ?? skill.latestVersion;

      console.log(`\nInstalling ${id}@${version}...`);

      // Get package from storage
      const pkg = await storage.retrieve(id, version);
      if (!pkg) {
        console.error(`Package not found in storage: ${id}@${version}`);
        console.log('\nPackage metadata exists but files not stored yet.');
        console.log('Run: openclaw clawhub install', id);
        return;
      }

      // Write files to target directory
      const targetDir = options.dir;
      const { mkdir, writeFile } = await import('fs/promises');
      await mkdir(targetDir, { recursive: true });

      for (const [path, content] of pkg.files) {
        const targetPath = join(targetDir, path);
        await mkdir(join(targetPath, '..'), { recursive: true });
        await writeFile(targetPath, content);
        console.log(`  Created: ${path}`);
      }

      console.log(`\n✅ Installed ${id}@${version} to ${targetDir}`);
    } catch (error) {
      console.error(`Failed to install: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// ====================
// Publish command
// ====================
program
  .command('publish <path>')
  .description('Publish a skill from a directory')
  .option('-k, --api-key <key>', 'API key for authentication')
  .option('--dry-run', 'Validate without publishing')
  .action(async (path: string, options: { dryRun?: boolean; apiKey?: string }) => {
    try {
      // Read SKILL.md
      const skillMdPath = join(path, 'SKILL.md');
      if (!existsSync(skillMdPath)) {
        console.error('SKILL.md not found in:', path);
        process.exit(1);
      }

      const content = await readFile(skillMdPath, 'utf-8');
      const parsed = parseSkillMd(content);

      console.log('\n📦 Publishing skill:');
      console.log(`  ID:          ${parsed.id}`);
      console.log(`  Version:     ${parsed.version}`);
      console.log(`  Description: ${parsed.description}`);
      console.log(`  Author:      ${parsed.author}`);

      if (options.dryRun) {
        console.log('\n✅ Validation passed. Use without --dry-run to publish.');
        return;
      }

      // Collect all files
      const files = new Map<string, Buffer>();
      const entries = await readdir(path, { recursive: true, withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (entry.name.startsWith('.')) continue;
        if (entry.name === 'node_modules') continue;

        const fullPath = join(entry.parentPath ?? entry.path, entry.name);
        const relativePath = relative(path, fullPath);
        const fileContent = await readFile(fullPath);
        files.set(relativePath, fileContent);
      }

      // Store files
      const storage = getStorage();
      await storage.init();
      const manifest = await storage.store(parsed.id, parsed.version, files);

      console.log(`\n  Files:       ${manifest.files.length}`);
      console.log(`  Size:        ${manifest.size} bytes`);
      console.log(`  Checksum:    ${manifest.checksum.slice(0, 16)}...`);

      // Save to database
      const service = getService();

      // Check if skill exists
      const existing = await service.list({ query: parsed.name, page: 1, pageSize: 1, sort: 'name', order: 'asc' });
      const skillExists = existing.data.some(s => s.id === parsed.id);

      if (!skillExists) {
        await service.create({
          id: parsed.id,
          name: parsed.name,
          namespace: parsed.namespace,
          description: parsed.description,
          author: parsed.author,
          license: parsed.license,
          version: parsed.version,
          keywords: parsed.keywords,
          categories: parsed.categories,
          downloads: 0,
          stars: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Publish version
      await service.publishVersion({
        skillId: parsed.id,
        version: parsed.version,
        description: parsed.description,
        changelog: '',
        deprecated: false,
        yanked: false,
        publishedAt: new Date(),
        installCommands: parsed.installCommands,
      });

      console.log('\n✅ Published successfully!');
    } catch (error) {
      console.error('Failed to publish:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ====================
// Server command
// ====================
program
  .command('serve')
  .description('Start the API server')
  .option('-p, --port <number>', 'Port number', '8080')
  .option('-h, --host <string>', 'Host address', '0.0.0.0')
  .action(async (options: { port: string; host: string }) => {
    const port = parseInt(options.port, 10);
    const server = await createServer({
      port,
      host: options.host,
      logger: true,
    });

    await server.listen({ port, host: options.host });

    console.log(`\n🚀 ClawSkill API Server running at http://${options.host}:${port}`);
    console.log(`📚 API docs at http://${options.host}:${port}/docs`);
    console.log(`🔍 Skill URL API at http://${options.host}:${port}/skill/{namespace}/{name}`);
  });

// ====================
// API Key commands
// ====================
program
  .command('key:create <name>')
  .description('Create a new API key')
  .option('-s, --scopes <scopes>', 'Comma-separated scopes', 'read,write')
  .action(async (name: string, options: { scopes: string }) => {
    const scopes = options.scopes.split(',').map(s => s.trim());
    const key = await createApiKey(name, scopes);
    console.log(`\n✅ API key created:`);
    console.log(`  Name:   ${name}`);
    console.log(`  Scopes: ${scopes.join(', ')}`);
    console.log(`  Key:    ${key}`);
    console.log('\n⚠️  Save this key securely. It will not be shown again.');
  });

program
  .command('key:generate')
  .description('Generate a new API key (offline)')
  .action(() => {
    const key = generateApiKey();
    console.log(`\nGenerated API key: ${key}`);
    console.log('\nTo use this key, insert it into the api_keys table:');
    console.log(`  INSERT INTO api_keys (key, name, scopes) VALUES ('${key}', 'my-key', ARRAY['read','write']);`);
  });

export { program };

// Run CLI when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}