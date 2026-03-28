/**
 * clawskill registry 命令
 * 
 * 管理 CLI-Hub 和 ClawHub 注册表
 */

import { Command } from 'commander';
import { registrySync } from '../../executor/registry-sync';

export const registryCommand = new Command('registry')
  .description('Manage skill registries');

/**
 * registry sync - 同步注册表
 */
registryCommand
  .command('sync')
  .description('Sync CLI-Hub registry')
  .option('-f, --force', 'Force refresh cache', false)
  .action(async (options: { force?: boolean }) => {
    try {
      console.log('\n🔄 Syncing CLI-Hub registry...\n');
      
      const registry = await registrySync.syncCLIHub({ force: options.force });
      
      console.log(`  ✅ Synced ${registry.clis.length} skills`);
      console.log(`  📅 Last updated: ${registry.meta.updated}`);
      console.log('');
      
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * registry list - 列出注册表内容
 */
registryCommand
  .command('list')
  .description('List registry contents')
  .option('-c, --category <category>', 'Filter by category')
  .option('--json', 'Output as JSON', false)
  .action(async (options: { category?: string; json?: boolean }) => {
    try {
      const merged = await registrySync.getMergedRegistry();
      
      let skills = merged.skills;
      
      if (options.category) {
        skills = skills.filter(s => 
          s.category.toLowerCase() === options.category!.toLowerCase()
        );
      }
      
      if (options.json) {
        console.log(JSON.stringify(skills, null, 2));
        return;
      }
      
      console.log(`\n📋 Registry: ${skills.length} skills\n`);
      
      // Group by category
      const byCategory: Record<string, typeof skills> = {};
      for (const skill of skills) {
        if (!byCategory[skill.category]) {
          byCategory[skill.category] = [];
        }
        byCategory[skill.category].push(skill);
      }
      
      for (const [category, items] of Object.entries(byCategory)) {
        console.log(`\n[${category.toUpperCase()}] (${items.length})`);
        for (const skill of items) {
          console.log(`  ${skill.url.padEnd(50)} ${skill.name}`);
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * registry categories - 列出类别
 */
registryCommand
  .command('categories')
  .description('List skill categories')
  .action(async () => {
    try {
      const categories = await registrySync.getCategories();
      
      console.log('\n📊 Skill categories:\n');
      console.log('  CATEGORY'.padEnd(20), 'COUNT');
      console.log('  '.padEnd(20, '-'), '-----');
      
      for (const cat of categories) {
        console.log(`  ${cat.name.padEnd(20)} ${cat.count}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * registry info - 显示注册表信息
 */
registryCommand
  .command('info')
  .description('Show registry information')
  .action(async () => {
    try {
      const merged = await registrySync.getMergedRegistry();
      
      console.log('\n📊 Registry Information\n');
      console.log(`  Version:    ${merged.version}`);
      console.log(`  Updated:    ${merged.updated}`);
      console.log(`  Total:      ${merged.skills.length} skills`);
      console.log(`  Sources:    CLI-Anything`);
      console.log('');
      
      console.log('  Categories:');
      for (const [name, count] of Object.entries(merged.categories)) {
        console.log(`    ${name.padEnd(15)} ${count}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

export default registryCommand;