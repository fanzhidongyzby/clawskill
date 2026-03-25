import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { uninstallSkill } from '../api/skills'

export const uninstallCommand = new Command('uninstall')
  .description('卸载技能')
  .argument('<skill-id>', '技能 ID')
  .option('-y, --yes', '跳过确认', false)
  .action(async (skillId: string, options) => {
    if (!options.yes) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `确定要卸载技能 ${skillId} 吗？`,
          default: false,
        },
      ])

      if (!confirm) {
        console.log(chalk.yellow('已取消卸载'))
        return
      }
    }

    const spinner = ora('卸载中...').start()

    try {
      await uninstallSkill(skillId)
      spinner.succeed(chalk.green('卸载成功！'))
    } catch (error) {
      spinner.stop()
      console.error(chalk.red('卸载失败:'), error)
      process.exit(1)
    }
  })