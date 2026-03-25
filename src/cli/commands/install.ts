import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { installSkill } from '../api/skills'
import { getInstalledSkills } from '../utils/storage'

export const installCommand = new Command('install')
  .description('安装技能')
  .argument('<skill-id>', '技能 ID')
  .option('-v, --version <version>', '指定版本')
  .option('-f, --force', '强制重新安装', false)
  .action(async (skillId: string, options) => {
    const spinner = ora('安装中...').start()

    try {
      await installSkill(skillId, {
        version: options.version,
        force: options.force,
      })

      spinner.succeed(chalk.green('安装成功！'))

      const installed = await getInstalledSkills()
      console.log(chalk.gray(`\n已安装 ${installed.length} 个技能`))
    } catch (error) {
      spinner.stop()
      console.error(chalk.red('安装失败:'), error)
      process.exit(1)
    }
  })