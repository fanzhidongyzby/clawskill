import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { searchSkills, semanticSearch } from '../api/search'
import { formatSkillTable } from '../utils/format'

export const searchCommand = new Command('search')
  .description('搜索技能')
  .argument('<query>', '搜索关键词')
  .option('-s, --semantic', '启用语义搜索', false)
  .option('-c, --category <category>', '按分类筛选')
  .option('-l, --limit <number>', '结果数量限制', '10')
  .option('-o, --offset <number>', '结果偏移量', '0')
  .action(async (query: string, options) => {
    const spinner = ora('搜索中...').start()

    try {
      const limit = parseInt(options.limit)
      const offset = parseInt(options.offset)

      let results
      if (options.semantic) {
        spinner.text = '语义搜索中...'
        results = await semanticSearch(query, {
          category: options.category,
          limit,
          offset,
        })
      } else {
        results = await searchSkills(query, {
          category: options.category,
          limit,
          offset,
        })
      }

      spinner.stop()

      if (results.items.length === 0) {
        console.log(chalk.yellow('未找到匹配的技能'))
        return
      }

      console.log(chalk.green.bold(`\n找到 ${results.total} 个结果：\n`))
      console.log(formatSkillTable(results.items))

      if (results.total > limit) {
        console.log(chalk.gray(`\n显示 ${offset + 1}-${Math.min(offset + limit, results.total)} / ${results.total} 个结果`))
        console.log(chalk.gray(`使用 --offset ${offset + limit} 查看更多`))
      }
    } catch (error) {
      spinner.stop()
      console.error(chalk.red('搜索失败:'), error)
      process.exit(1)
    }
  })