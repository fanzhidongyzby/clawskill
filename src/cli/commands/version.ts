import { Command } from 'commander'
import chalk from 'chalk'
import { getSkillInfo } from '../api/skills'

export const versionCommand = new Command('version')
  .description('查看技能版本信息')
  .argument('<skill-id>', '技能 ID')
  .action(async (skillId: string) => {
    try {
      const info = await getSkillInfo(skillId)

      console.log(chalk.green.bold(`\n技能: ${info.name}\n`))
      console.log(chalk.gray('版本信息:'))
      console.log(`  当前版本: ${chalk.cyan(info.current_version)}`)
      console.log(`  最新版本: ${chalk.cyan(info.latest_version)}`)

      if (info.versions && info.versions.length > 0) {
        console.log(chalk.gray('\n版本历史:'))
        info.versions.forEach((v: any) => {
          console.log(`  - ${chalk.cyan(v.version)} (${v.created_at})`)
          if (v.changelog) {
            console.log(`    ${chalk.gray(v.changelog)}`)
          }
        })
      }
    } catch (error) {
      console.error(chalk.red('获取版本信息失败:'), error)
      process.exit(1)
    }
  })