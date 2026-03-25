import { Command } from 'commander'
import chalk from 'chalk'
import { logout } from '../api/auth'

export const logoutCommand = new Command('logout')
  .description('登出')
  .action(async () => {
    try {
      await logout()
      console.log(chalk.green('已登出'))
    } catch (error) {
      console.error(chalk.red('登出失败:'), error)
      process.exit(1)
    }
  })