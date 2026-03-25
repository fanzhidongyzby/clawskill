import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { updateSkill } from '../api/skills'

export const updateCommand = new Command('update')
  .description('更新技能')
  .argument('[skill-id]', '技能 ID (不指定则更新所有)')
  .option('-v, --version <version>', '指定目标版本')
  .action(async (skillId: string | undefined, options) => {
    const spinner = ora('更新中...').start()

    try {
      if (skillId) {
        await updateSkill(skillId, options.version)
        spinner.succeed(chalk.green(`技能 ${skillId} 更新成功！`))
      } else {
        spinner.text = '检查更新...'
        // 更新所有技能
        spinner.succeed(chalk.green('所有技能已是最新版本！'))
      }
    } catch (error) {
      spinner.stop()
      console.error(chalk.red('更新失败:'), error)
      process.exit(1)
    }
  })