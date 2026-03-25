import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { login } from '../api/auth'

export const loginCommand = new Command('login')
  .description('登录到 OpenClaw 技能平台')
  .option('-u, --username <username>', '用户名')
  .option('-p, --password <password>', '密码')
  .action(async (options) => {
    try {
      let username = options.username
      let password = options.password

      if (!username || !password) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'username',
            message: '用户名:',
            when: !username,
          },
          {
            type: 'password',
            name: 'password',
            message: '密码:',
            when: !password,
            mask: '*',
          },
        ])
        username = username || answers.username
        password = password || answers.password
      }

      const spinner = ora('登录中...').start()
      const result = await login(username, password)
      spinner.succeed(chalk.green('登录成功！'))

      console.log(chalk.gray(`\n欢迎, ${result.user.username}!`))
    } catch (error) {
      console.error(chalk.red('登录失败:'), error)
      process.exit(1)
    }
  })