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

// ====================
// GitHub Sync command
// ====================
program
  .command('github:sync')
  .description('Sync skills from GitHub')
  .option('-o, --org <organization>', 'GitHub organization or user')
  .option('-t, --topic <topic>', 'Repository topic', 'agent-skill')
  .option('-l, --limit <number>', 'Max skills to sync', '100')
  .action(async (options: { org?: string; topic: string; limit: string }) => {
    const { GitHubSource, GitHubSourceConfig } = await import('../github/sources/github-source');
    const { Syncer } = await import('../github/syncer/syncer');

    const config: GitHubSourceConfig = {
      token: process.env.GITHUB_TOKEN,
      org: options.org,
      topic: options.topic,
    };

    const githubSource = new GitHubSource(config);
    const syncer = new Syncer(githubSource);

    console.log(`\n🔄 Syncing skills from GitHub...`);
    console.log(`  Topic: ${options.topic}`);
    if (options.org) console.log(`  Org: ${options.org}`);

    const result = await syncer.sync({ limit: parseInt(options.limit, 10) });

    console.log(`\n✅ Sync completed:`);
    console.log(`  Total:      ${result.total}`);
    console.log(`  Added:      ${result.added}`);
    console.log(`  Updated:    ${result.updated}`);
    console.log(`  Skipped:    ${result.skipped}`);
    console.log(`  Failed:     ${result.failed}`);
    console.log(`  Duration:   ${result.duration}ms`);
  });

// ====================
// Security Scan command
// ====================
program
  .command('security:scan <skill>')
  .description('Scan a skill for security issues')
  .option('-v, --version <version>', 'Skill version (default: latest)')
  .option('--secrets', 'Scan for secrets', true)
  .option('--dependencies', 'Scan dependencies', true)
  .option('--code', 'Scan code patterns', false)
  .action(async (skillId: string, options: { version?: string; secrets: boolean; dependencies: boolean; code: boolean }) => {
    const { SecurityScanner } = await import('../security/scanner/security-scanner');
    const { SecretScanner } = await import('../security/scanner/secret-scanner');
    const { DependencyScanner } = await import('../security/scanner/dependency-scanner');

    const secretScanner = new SecretScanner();
    const dependencyScanner = new DependencyScanner();
    const scanner = new SecurityScanner({ secretScanner, dependencyScanner });

    console.log(`\n🔒 Scanning ${skillId}${options.version ? `@${options.version}` : ''}...`);

    const result = await scanner.scan({
      skillId,
      version: options.version,
      scanSecrets: options.secrets,
      scanDependencies: options.dependencies,
      scanCode: options.code,
    });

    console.log(`\n📊 Scan Results:`);
    console.log(`  Status:       ${result.status}`);
    console.log(`  Total findings: ${result.findings.length}`);

    if (result.severityCounts) {
      console.log(`  Critical:     ${result.severityCounts.critical || 0}`);
      console.log(`  High:         ${result.severityCounts.high || 0}`);
      console.log(`  Medium:       ${result.severityCounts.medium || 0}`);
      console.log(`  Low:          ${result.severityCounts.low || 0}`);
    }

    if (result.findings.length > 0) {
      console.log(`\n🔍 Findings:`);
      for (const finding of result.findings.slice(0, 10)) {
        console.log(`  [${finding.severity.toUpperCase()}] ${finding.type}`);
        console.log(`    ${finding.filePath}:${finding.lineNumber}`);
        console.log(`    ${finding.description}`);
      }

      if (result.findings.length > 10) {
        console.log(`  ... and ${result.findings.length - 10} more findings`);
      }
    }
  });

// ====================
// Search command (enhanced)
// ====================
program
  .command('search:semantic <query>')
  .description('Semantic search for skills')
  .option('-c, --category <category>', 'Filter by category')
  .option('-l, --language <language>', 'Filter by language')
  .option('-s, --stars <number>', 'Minimum stars')
  .option('--limit <number>', 'Max results', '20')
  .action(async (query: string, options: { category?: string; language?: string; stars?: string; limit: string }) => {
    const { SemanticSearcher } = await import('../semantic-search/searcher/semantic-searcher');
    const { RankingEngine } = await import('../semantic-search/ranking/ranking-engine');
    const { FilterEngine } = await import('../semantic-search/filter/filter-engine');

    const searcher = new SemanticSearcher({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
    });

    const rankingEngine = new RankingEngine();
    const filterEngine = new FilterEngine();

    console.log(`\n🔍 Searching: "${query}"`);

    const results = await searcher.semanticSearch({
      query,
      limit: parseInt(options.limit, 10),
      filters: {
        category: options.category,
        language: options.language,
        minStars: options.stars ? parseInt(options.stars, 10) : undefined,
      },
    });

    // Apply filters
    let filteredResults = results;
    if (options.category || options.language || options.stars) {
      filteredResults = await filterEngine.filter(results, {
        category: options.category,
        language: options.language,
        minStars: options.stars ? parseInt(options.stars, 10) : undefined,
      });
    }

    // Apply ranking
    const rankedResults = await rankingEngine.rank(filteredResults, {
      query,
      boostFresh: true,
      boostPopular: true,
    });

    console.log(`\nFound ${rankedResults.length} results:\n`);
    for (const result of rankedResults.slice(0, 10)) {
      console.log(`  ${result.skillId}`);
      console.log(`    Score:   ${result.score.toFixed(4)}`);
      console.log(`    Name:    ${result.metadata?.name || 'N/A'}`);
      console.log(`    Desc:    ${result.metadata?.description || 'N/A'}`);
      console.log('');
    }
  });

export { program };

// Run CLI when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}