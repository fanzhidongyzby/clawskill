import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { getSkillVersions, rollbackSkill } from '../api/skills'

export const rollbackCommand = new Command('rollback')
  .description('回滚技能到指定版本')
  .argument('<skill-id>', '技能 ID')
  .action(async (skillId: string) => {
    const spinner = ora('获取版本历史...').start()

    try {
      const versions = await getSkillVersions(skillId)
      spinner.stop()

      if (versions.length === 0) {
        console.log(chalk.yellow('没有可用的历史版本'))
        return
      }

      const { targetVersion } = await inquirer.prompt([
        {
          type: 'list',
          name: 'targetVersion',
          message: '选择要回滚到的版本:',
          choices: versions.map((v: any) => ({
            name: `${v.version} (${v.created_at})`,
            value: v.version,
          })),
        },
      ])

      const rollbackSpinner = ora('回滚中...').start()
      await rollbackSkill(skillId, targetVersion)
      rollbackSpinner.succeed(chalk.green(`已回滚到版本 ${targetVersion}！`))
    } catch (error) {
      spinner.stop()
      console.error(chalk.red('回滚失败:'), error)
      process.exit(1)
    }
  })