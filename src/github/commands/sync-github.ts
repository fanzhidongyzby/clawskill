/**
 * GitHub 同步命令
 * 用于从 GitHub 同步技能数据
 */
import { GitHubSource, Syncer } from '../index';
import fs from 'fs/promises';
import path from 'path';

/**
 * 配置
 */
const config = {
  // GitHub Token（从环境变量读取）
  token: process.env.GITHUB_TOKEN || '',

  // 搜索配置
  topic: 'agent-skill',
  language: 'TypeScript',
  minStars: 0,
  includeForks: false,

  // 同步配置
  batchSize: 5,
  includeVersions: true,
  validateSkillMD: true,
  concurrency: 3,
};

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Starting GitHub sync...\n');

  // 1. 创建 GitHub Source
  const source = new GitHubSource({
    token: config.token || undefined,
    topic: config.topic,
    language: config.language,
    minStars: config.minStars,
    includeForks: config.includeForks,
  });

  // 2. 创建 Syncer
  const syncer = new Syncer(source);

  // 3. 执行同步
  const result = await syncer.sync({
    batchSize: config.batchSize,
    includeVersions: config.includeVersions,
    validateSkillMD: config.validateSkillMD,
    concurrency: config.concurrency,
  });

  // 4. 保存索引到文件
  const outputDir = path.join(__dirname, '../../data');
  await fs.mkdir(outputDir, { recursive: true });

  const outputFile = path.join(outputDir, 'skill-index.json');
  const indexData = JSON.stringify(result.indices, null, 2);
  await fs.writeFile(outputFile, indexData, 'utf-8');

  console.log(`✅ Index saved to: ${outputFile}`);

  // 5. 保存错误日志
  if (result.errors.length > 0) {
    const errorFile = path.join(outputDir, 'sync-errors.json');
    const errorData = JSON.stringify(result.errors, null, 2);
    await fs.writeFile(errorFile, errorData, 'utf-8');

    console.log(`⚠️  Errors saved to: ${errorFile}`);
  }

  console.log('\n✅ Sync completed successfully!');
}

// 运行
main().catch((error) => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});