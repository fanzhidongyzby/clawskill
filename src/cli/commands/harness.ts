/**
 * clawskill harness 命令
 * 
 * 构建、测试、验证 CLI-Anything harness
 */

import { Command } from 'commander';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

export const harnessCommand = new Command('harness')
  .description('Build and manage CLI-Anything harnesses');

/**
 * harness build - 为软件构建 CLI harness
 */
harnessCommand
  .command('build <source>')
  .description('Build a CLI-Anything harness for a software')
  .option('-o, --output <dir>', 'Output directory')
  .option('--skip-tests', 'Skip test generation', false)
  .option('--skip-docs', 'Skip documentation generation', false)
  .action(async (source: string, options: { output?: string; skipTests?: boolean; skipDocs?: boolean }) => {
    try {
      console.log(`\n🔨 Building CLI-Anything harness for: ${source}\n`);
      
      // Determine source type
      const isGitHub = source.startsWith('http://') || source.startsWith('https://');
      const isLocal = existsSync(source);
      
      if (!isGitHub && !isLocal) {
        console.error(`Error: Source '${source}' is not a valid GitHub URL or local path`);
        process.exit(1);
      }
      
      // Get software name
      const softwareName = isLocal 
        ? basename(source)
        : basename(source.replace(/\.git$/, '').replace(/\/$/, ''));
      
      const outputDir = options.output || join(process.cwd(), softwareName);
      
      console.log(`  Software:  ${softwareName}`);
      console.log(`  Output:    ${outputDir}`);
      console.log(`  Source:    ${isGitHub ? 'GitHub' : 'Local'}`);
      console.log('');
      
      // Create harness structure
      const harnessDir = join(outputDir, 'agent-harness');
      const cliAnythingDir = join(harnessDir, 'cli_anything', softwareName);
      
      mkdirSync(cliAnythingDir, { recursive: true });
      mkdirSync(join(cliAnythingDir, 'core'), { recursive: true });
      mkdirSync(join(cliAnythingDir, 'utils'), { recursive: true });
      mkdirSync(join(cliAnythingDir, 'tests'), { recursive: true });
      
      // Generate basic structure
      console.log('  📁 Creating harness structure...');
      
      // Generate __init__.py
      writeFileSync(join(cliAnythingDir, '__init__.py'), generateInitPy(softwareName));
      
      // Generate CLI main file
      writeFileSync(join(cliAnythingDir, `${softwareName}_cli.py`), generateCliPy(softwareName));
      
      // Generate setup.py
      writeFileSync(join(harnessDir, 'setup.py'), generateSetupPy(softwareName));
      
      // Generate README
      writeFileSync(join(harnessDir, 'README.md'), generateReadme(softwareName));
      
      // Generate SKILL.md
      writeFileSync(join(cliAnythingDir, 'skills', 'SKILL.md'), generateSkillMd(softwareName));
      mkdirSync(join(cliAnythingDir, 'skills'), { recursive: true });
      
      console.log('  ✅ Harness structure created');
      console.log('');
      console.log('  📋 Next steps:');
      console.log(`     1. cd ${harnessDir}`);
      console.log('     2. pip install -e .');
      console.log(`     3. cli-anything-${softwareName} --help`);
      console.log('');
      
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * harness refine - 扩展现有 harness
 */
harnessCommand
  .command('refine <harness-path>')
  .description('Refine an existing harness to expand coverage')
  .option('-f, --focus <area>', 'Focus area for refinement')
  .action(async (harnessPath: string, options: { focus?: string }) => {
    try {
      console.log(`\n🔧 Refining harness: ${harnessPath}\n`);
      
      if (!existsSync(harnessPath)) {
        console.error(`Error: Harness path '${harnessPath}' does not exist`);
        process.exit(1);
      }
      
      // Read existing structure
      const softwareName = basename(harnessPath.replace('/agent-harness', ''));
      
      console.log(`  Software:  ${softwareName}`);
      if (options.focus) {
        console.log(`  Focus:     ${options.focus}`);
      }
      console.log('');
      
      // Analyze current coverage
      console.log('  📊 Analyzing current coverage...');
      
      // TODO: Implement gap analysis
      console.log('  ℹ️  Gap analysis requires AI coding agent integration');
      console.log('');
      console.log('  To refine with CLI-Anything:');
      console.log('     Use Claude Code with /cli-anything:refine command');
      console.log('');
      
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * harness test - 运行 harness 测试
 */
harnessCommand
  .command('test <harness-path>')
  .description('Run tests for a harness')
  .option('-v, --verbose', 'Verbose output', false)
  .option('-c, --coverage', 'Generate coverage report', false)
  .action(async (harnessPath: string, options: { verbose?: boolean; coverage?: boolean }) => {
    try {
      console.log(`\n🧪 Running tests: ${harnessPath}\n`);
      
      const testsDir = join(harnessPath, 'cli_anything');
      
      if (!existsSync(testsDir)) {
        console.error(`Error: Tests directory not found: ${testsDir}`);
        process.exit(1);
      }
      
      // Run pytest
      const pytestArgs = [
        'pytest',
        testsDir,
        options.verbose ? '-v' : '',
        options.coverage ? '--cov=cli_anything' : '',
      ].filter(Boolean).join(' ');
      
      console.log(`  Running: ${pytestArgs}`);
      console.log('');
      
      execSync(pytestArgs, { stdio: 'inherit' });
      
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * harness validate - 验证 harness 标准
 */
harnessCommand
  .command('validate <harness-path>')
  .description('Validate a harness against CLI-Anything standards')
  .action(async (harnessPath: string) => {
    try {
      console.log(`\n✅ Validating harness: ${harnessPath}\n`);
      
      const issues: string[] = [];
      const warnings: string[] = [];
      
      // Check structure
      const checks = [
        { path: join(harnessPath, 'setup.py'), name: 'setup.py' },
        { path: join(harnessPath, 'cli_anything'), name: 'cli_anything/ directory' },
        { path: join(harnessPath, 'README.md'), name: 'README.md' },
      ];
      
      for (const check of checks) {
        if (existsSync(check.path)) {
          console.log(`  ✅ ${check.name}`);
        } else {
          console.log(`  ❌ ${check.name} (missing)`);
          issues.push(`Missing ${check.name}`);
        }
      }
      
      // Check for SKILL.md
      const skillMdPath = findSkillMd(harnessPath);
      if (skillMdPath) {
        console.log(`  ✅ SKILL.md (${skillMdPath})`);
      } else {
        console.log(`  ⚠️  SKILL.md (recommended)`);
        warnings.push('Missing SKILL.md - agents cannot discover this CLI');
      }
      
      // Check for tests
      const testsDir = join(harnessPath, 'cli_anything');
      if (existsSync(testsDir)) {
        console.log(`  ✅ tests/ directory`);
      } else {
        console.log(`  ⚠️  tests/ directory (recommended)`);
        warnings.push('Missing tests - no test coverage');
      }
      
      console.log('');
      
      if (issues.length > 0) {
        console.log('  ❌ Issues:');
        issues.forEach(i => console.log(`     - ${i}`));
      }
      
      if (warnings.length > 0) {
        console.log('  ⚠️  Warnings:');
        warnings.forEach(w => console.log(`     - ${w}`));
      }
      
      if (issues.length === 0 && warnings.length === 0) {
        console.log('  🎉 All checks passed!');
      }
      
      console.log('');
      
      process.exit(issues.length > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

// ==================== Helper Functions ====================

function findSkillMd(harnessPath: string): string | null {
  const possiblePaths = [
    join(harnessPath, 'cli_anything', 'skills', 'SKILL.md'),
    join(harnessPath, 'SKILL.md'),
  ];
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }
  
  return null;
}

function generateInitPy(name: string): string {
  return `"""
CLI-Anything harness for ${name}
Generated by ClawSkill
"""

__version__ = "1.0.0"
`;
}

function generateCliPy(name: string): string {
  return `"""
${name} CLI - Agent-native command line interface
"""

import click
from cli_anything.${name}.utils.repl_skin import ReplSkin

@click.group(invoke_without_command=True)
@click.pass_context
@click.option('--json', 'json_output', is_flag=True, help='Output in JSON format')
@click.option('--project', '-p', type=click.Path(), help='Project file path')
def cli(ctx, json_output, project):
    """${name} CLI for AI agents."""
    ctx.ensure_object(dict)
    ctx.obj['json'] = json_output
    ctx.obj['project'] = project
    
    if ctx.invoked_subcommand is None:
        # Enter REPL mode
        ctx.invoke(repl)

@cli.command()
@click.pass_context
def repl(ctx):
    """Start interactive REPL session."""
    skin = ReplSkin("${name}", version="1.0.0")
    skin.print_banner()
    
    # TODO: Implement REPL
    skin.info("REPL mode - type 'help' for commands, 'exit' to quit")
    
    while True:
        try:
            line = input(f"${name}> ")
            if line.lower() in ('exit', 'quit', 'q'):
                skin.print_goodbye()
                break
            elif line.lower() == 'help':
                click.echo(cli.get_help(ctx))
            else:
                skin.warning(f"Unknown command: {line}")
        except (EOFError, KeyboardInterrupt):
            skin.print_goodbye()
            break

@cli.command()
@click.option('--name', '-n', required=True, help='Project name')
@click.option('--output', '-o', type=click.Path(), help='Output path')
@click.pass_context
def new(ctx, name, output):
    """Create a new project."""
    # TODO: Implement
    click.echo(f"Creating project: {name}")

if __name__ == '__main__':
    cli()
`;
}

function generateSetupPy(name: string): string {
  return `"""
Setup script for ${name} CLI harness
"""

from setuptools import setup, find_packages

setup(
    name="cli-anything-${name}",
    version="1.0.0",
    description="CLI-Anything harness for ${name}",
    packages=find_packages(include=["cli_anything.*"]),
    package_data={
        "": ["*.md", "*.txt"],
    },
    include_package_data=True,
    entry_points={
        "console_scripts": [
            "cli-anything-${name}=cli_anything.${name}.${name}_cli:cli",
        ],
    },
    install_requires=[
        "click>=8.0",
    ],
    python_requires=">=3.10",
)
`;
}

function generateReadme(name: string): string {
  return `# ${name} CLI Harness

Agent-native CLI interface for ${name}, generated by ClawSkill CLI-Anything integration.

## Installation

\`\`\`bash
pip install -e .
\`\`\`

## Usage

\`\`\`bash
# Show help
cli-anything-${name} --help

# Start REPL
cli-anything-${name}

# JSON output for agents
cli-anything-${name} --json <command>
\`\`\`

## Generated by

ClawSkill CLI-Anything Integration
`;
}

function generateSkillMd(name: string): string {
  return `---
name: ${name}
description: CLI-Anything harness for ${name} - agent-native command line interface
---

# ${name} CLI

Agent-native CLI interface for ${name}.

## Commands

### Project Management
- \`new\` - Create a new project
- \`open\` - Open an existing project
- \`save\` - Save the current project

### Operations
- \`list\` - List items
- \`add\` - Add new item
- \`remove\` - Remove item

## Usage

\`\`\`bash
# JSON output for agents
cli-anything-${name} --json new --name my-project

# REPL mode
cli-anything-${name}
\`\`\`

## Installation

\`\`\`bash
pip install -e .
\`\`\`
`;
}

export default harnessCommand;