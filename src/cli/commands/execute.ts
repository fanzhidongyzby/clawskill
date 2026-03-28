/**
 * clawskill execute 命令
 * 
 * 执行 CLI-Anything 技能命令
 */

import { Command } from 'commander';
import { skillExecutor } from '../../executor/skill-executor';
import { SkillSearchResult } from '../../types/skill';

export const executeCommand = new Command('execute')
  .description('Execute a CLI-Anything skill command')
  .argument('<skill>', 'Skill URL (e.g., skill://cli-anything/blender)')
  .argument('[command]', 'Command to execute')
  .argument('[args...]', 'Command arguments')
  .option('-j, --json', 'Output in JSON format', true)
  .option('-p, --project <path>', 'Project file path')
  .option('-t, --timeout <ms>', 'Execution timeout in milliseconds', '30000')
  .option('--install', 'Auto-install skill if not present', true)
  .option('--no-install', 'Do not auto-install')
  .action(async (skillUrl: string, command?: string, args?: string[], options?: any) => {
    try {
      // Handle skill URL without command - show info
      if (!command) {
        await showSkillInfo(skillUrl);
        return;
      }
      
      // Parse args
      const cliArgs = args || [];
      const commandArgs = parseCommandArgs(cliArgs);
      
      // Execute
      const result = await skillExecutor.execute(
        skillUrl,
        command,
        commandArgs,
        {
          json: options?.json ?? true,
          project: options?.project,
          timeout: parseInt(options?.timeout ?? '30000', 10),
        }
      );
      
      // Output result
      if (options?.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.success) {
          console.log(result.output);
        } else {
          console.error('Error:', result.error);
          process.exit(1);
        }
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * clawskill skill 命令组
 */
export const skillCommand = new Command('skill')
  .description('Manage CLI-Anything skills');

skillCommand
  .command('search <query>')
  .description('Search for CLI-Anything skills')
  .option('-c, --category <category>', 'Filter by category')
  .action(async (query: string, options: { category?: string }) => {
    try {
      let results: SkillSearchResult[];
      
      if (options.category) {
        results = await skillExecutor.listSkillsByCategory(options.category);
        results = results.filter((r: SkillSearchResult) => 
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.description.toLowerCase().includes(query.toLowerCase())
        );
      } else {
        results = await skillExecutor.searchSkills(query);
      }
      
      if (results.length === 0) {
        console.log('No skills found.');
        return;
      }
      
      console.log(`\nFound ${results.length} skills:\n`);
      console.log('SKILL URL'.padEnd(50), 'CATEGORY'.padEnd(15), 'DESCRIPTION');
      console.log('-'.repeat(100));
      
      for (const skill of results) {
        const desc = skill.description.slice(0, 40) + (skill.description.length > 40 ? '...' : '');
        console.log(skill.url.padEnd(50), (skill.category || '').padEnd(15), desc);
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

skillCommand
  .command('list')
  .description('List all CLI-Anything skills')
  .option('-c, --category <category>', 'Filter by category')
  .action(async (options: { category?: string }) => {
    try {
      let skills: SkillSearchResult[];
      
      if (options.category) {
        skills = await skillExecutor.listSkillsByCategory(options.category);
      } else {
        skills = await skillExecutor.listAllSkills();
      }
      
      console.log(`\nCLI-Anything skills (${skills.length} total):\n`);
      
      // Group by category
      const byCategory: Record<string, SkillSearchResult[]> = {};
      for (const skill of skills) {
        const cat = skill.category || 'other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(skill);
      }
      
      for (const [category, items] of Object.entries(byCategory)) {
        console.log(`\n[${category.toUpperCase()}]`);
        for (const skill of items) {
          console.log(`  ${skill.url.padEnd(45)} ${skill.name}`);
        }
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

skillCommand
  .command('info <skill>')
  .description('Show skill details')
  .action(async (skillUrl: string) => {
    await showSkillInfo(skillUrl);
  });

skillCommand
  .command('install <skill>')
  .description('Install a CLI-Anything skill')
  .action(async (skillUrl: string) => {
    try {
      console.log(`\nInstalling ${skillUrl}...`);
      
      const result = await skillExecutor.installSkill(skillUrl);
      
      if (result.success) {
        console.log(`\n✅ Successfully installed ${skillUrl}`);
        
        // Show info after install
        await showSkillInfo(skillUrl);
      } else {
        console.error(`\n❌ Failed to install: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

skillCommand
  .command('categories')
  .description('List skill categories')
  .action(async () => {
    try {
      const categories = await skillExecutor.getCategories();
      
      console.log('\nSkill categories:\n');
      for (const cat of categories) {
        console.log(`  • ${cat}`);
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

skillCommand
  .command('help <skill>')
  .description('Show skill CLI help')
  .action(async (skillUrl: string) => {
    try {
      const help = await skillExecutor.getSkillHelp(skillUrl);
      console.log(help);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

// ==================== Helper Functions ====================

async function showSkillInfo(skillUrl: string): Promise<void> {
  try {
    const info = await skillExecutor.getSkillCLIInfo(skillUrl);
    
    console.log('\n' + '='.repeat(60));
    console.log(`  ${info.skillUrl}`);
    console.log('='.repeat(60));
    console.log(`  Entry Point:   ${info.entryPoint}`);
    console.log(`  Version:       ${info.version}`);
    console.log(`  Installed:     ${info.installed ? '✅ Yes' : '❌ No'}`);
    
    if (info.skillMdPath) {
      console.log(`  SKILL.md:      ${info.skillMdPath}`);
    }
    
    if (info.commandGroups.length > 0) {
      console.log('\n  Commands:');
      for (const group of info.commandGroups) {
        console.log(`\n    [${group.name}]`);
        for (const cmd of group.commands.slice(0, 10)) {
          console.log(`      ${cmd}`);
        }
        if (group.commands.length > 10) {
          console.log(`      ... and ${group.commands.length - 10} more`);
        }
      }
    }
    
    if (!info.installed) {
      console.log('\n  ⚠️  Install with: clawskill skill install ' + skillUrl);
    }
    
    console.log('');
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

function parseCommandArgs(args: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        result[key] = parseValue(nextArg);
        i += 2;
      } else {
        result[key] = true;
        i += 1;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      result[key] = true;
      i += 1;
    } else {
      // Positional argument - use index as key
      result[`arg${i}`] = arg;
      i += 1;
    }
  }
  
  return result;
}

function parseValue(value: string): any {
  // Try to parse as JSON
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Number
  const num = Number(value);
  if (!isNaN(num)) return num;
  
  return value;
}

export default executeCommand;