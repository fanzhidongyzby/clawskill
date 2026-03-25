import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { publishSkill } from '../api/publish'
import { readPackageJson } from '../utils/fs'
import semver from 'semver'

export const publishCommand = new Command('publish')
  .description('发布技能到平台')
  .option('-p, --path <path>', '技能目录路径', '.')
  .option('-v, --version <version>', '指定版本')
  .option('-d, --dry-run', '预发布模式', false)
  .action(async (options) => {
    try {
      const pkg = await readPackageJson(options.path)

      if (!pkg.name) {
        console.error(chalk.red('package.json 中缺少 name 字段'))
        process.exit(1)
      }

      let version = options.version || pkg.version
      if (!version) {
        const { inputVersion } = await inquirer.prompt([
          {
            type: 'input',
            name: 'inputVersion',
            message: '请输入版本号:',
            default: '1.0.0',
            validate: (input: string) => {
              if (!semver.valid(input)) {
                return '请输入有效的语义化版本号 (例如: 1.0.0)'
              }
              return true
            },
          },
        ])
        version = inputVersion
      }

      const { description } = await inquirer.prompt([
        {
          type: 'input',
          name: 'description',
          message: '技能描述:',
          default: pkg.description || '',
        },
      ])

      const { category } = await inquirer.prompt([
        {
          type: 'list',
          name: 'category',
          message: '选择分类:',
          choices: [
            'productivity',
            'automation',
            'ai',
            'development',
            'integration',
            'utility',
          ],
        },
      ])

      const spinner = ora('发布中...').start()

      await publishSkill({
        name: pkg.name,
        version,
        description,
        category,
        path: options.path,
        dryRun: options.dryRun,
      })

      spinner.succeed(chalk.green('发布成功！'))
    } catch (error) {
      console.error(chalk.red('发布失败:'), error)
      process.exit(1)
    }
  })