import Table from 'cli-table3'
import chalk from 'chalk'

export function formatSkillTable(skills: any[]): string {
  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('名称'),
      chalk.cyan('版本'),
      chalk.cyan('分类'),
      chalk.cyan('下载量'),
      chalk.cyan('评分'),
    ],
    colWidths: [30, 30, 12, 15, 10, 8],
  })

  skills.forEach((skill) => {
    table.push([
      skill.id.slice(0, 30),
      skill.name.slice(0, 30),
      skill.version,
      skill.category,
      skill.downloads || 0,
      skill.rating || 'N/A',
    ])
  })

  return table.toString()
}

export function formatError(error: any): string {
  if (error.response?.data?.detail) {
    return error.response.data.detail
  }
  if (error.message) {
    return error.message
  }
  return '未知错误'
}