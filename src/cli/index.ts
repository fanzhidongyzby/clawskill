/**
 * ClawSkill CLI
 */

import { Command } from 'commander';
import { createServer } from '../server/index';
import { SkillService } from '../core/skill-service';
import { parseSkillUrl, formatSkillUrl } from '../core/skill-url';
import { parseSkillMd } from '../core/parser';
import { readFile } from 'fs/promises';
import { join } from 'path';

const VERSION = process.env.npm_package_version ?? '0.1.0';

const program = new Command();

program
  .name('clawskill')
  .description('AI Agent Skill Package Manager')
  .version(VERSION);

// Search command
program
  .command('search <query>')
  .description('Search for skills')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-s, --size <number>', 'Page size', '20')
  .action(async (query: string, options: { page: string; size: string }) => {
    const service = new SkillService();
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

// Show command
program
  .command('show <skill>')
  .description('Show skill details')
  .action(async (skillId: string) => {
    const service = new SkillService();
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

// Install command
program
  .command('install <skill>')
  .description('Install a skill')
  .action(async (skillId: string) => {
    const service = new SkillService();
    const url = parseSkillUrl(skillId);

    try {
      const skill = await service.get(formatSkillUrl(url));
      console.log(`\nInstalling ${skill.namespace}/${skill.name}...`);

      if (skill.installCommands.length > 0) {
        console.log('\nRun the following command:');
        for (const cmd of skill.installCommands) {
          console.log(`  ${cmd.command}`);
        }
      } else {
        console.log(`\nRun: openclaw clawhub install ${skill.namespace}/${skill.name}`);
      }
    } catch {
      console.error(`Skill not found: ${skillId}`);
      process.exit(1);
    }
  });

// Publish command
program
  .command('publish <path>')
  .description('Publish a skill from a directory')
  .option('--dry-run', 'Validate without publishing')
  .action(async (path: string, options: { dryRun?: boolean }) => {
    try {
      const skillMdPath = join(path, 'SKILL.md');
      const content = await readFile(skillMdPath, 'utf-8');
      const parsed = parseSkillMd(content);

      console.log('\nSkill to publish:');
      console.log(`  ID:          ${parsed.id}`);
      console.log(`  Version:     ${parsed.version}`);
      console.log(`  Description: ${parsed.description}`);
      console.log(`  Author:      ${parsed.author}`);

      if (options.dryRun) {
        console.log('\n✅ Validation passed. Use without --dry-run to publish.');
        return;
      }

      const service = new SkillService();
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

      console.log('\n✅ Skill published successfully!');
    } catch (error) {
      console.error('Failed to publish:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List skills')
  .option('-a, --all', 'List all available skills from registry')
  .action(async (options: { all?: boolean }) => {
    const service = new SkillService();

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

// Server command
program
  .command('server')
  .description('Start the API server')
  .option('-p, --port <number>', 'Port number', '8080')
  .option('-h, --host <string>', 'Host address', '0.0.0.0')
  .action(async (options: { port: string; host: string }) => {
    const server = await createServer({
      port: parseInt(options.port, 10),
      host: options.host,
    });

    await server.listen({ port: parseInt(options.port, 10), host: options.host });

    console.log(`Server running at http://${options.host}:${options.port}`);
    console.log(`API docs at http://${options.host}:${options.port}/docs`);
  });

export { program };

// Run CLI when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}