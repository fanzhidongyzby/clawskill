import { Command } from 'commander'
import chalk from 'chalk'
import { getInstalledSkills } from '../utils/storage'
import { formatSkillTable } from '../utils/format'

export const listInstalledCommand = new Command('list:installed')
  .description('列出已安装的技能')
  .option('-a, --all', '显示所有版本', false)
  .action(async (options) => {
    try {
      const skills = await getInstalledSkills()

      if (skills.length === 0) {
        console.log(chalk.yellow('未安装任何技能'))
        return
      }

      console.log(chalk.green.bold(`\n已安装 ${skills.length} 个技能：\n`))
      console.log(formatSkillTable(skills))
    } catch (error) {
      console.error(chalk.red('获取列表失败:'), error)
      process.exit(1)
    }
  })