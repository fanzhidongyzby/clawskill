import { Command } from 'commander'
import chalk from 'chalk'
import { getCurrentUser } from '../api/auth'

export const whoamiCommand = new Command('whoami')
  .description('显示当前登录用户信息')
  .action(async () => {
    try {
      const user = await getCurrentUser()

      console.log(chalk.green.bold('\n当前用户:\n'))
      console.log(`  用户名: ${chalk.cyan(user.username)}`)
      console.log(`  邮箱: ${chalk.cyan(user.email)}`)
      console.log(`  角色: ${chalk.cyan(user.role)}`)
      console.log(`  ID: ${chalk.gray(user.id)}`)
    } catch (error) {
      console.error(chalk.red('获取用户信息失败:'), error)
      console.log(chalk.yellow('请先登录: openclaw login'))
      process.exit(1)
    }
  })