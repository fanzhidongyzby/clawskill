/**
 * 技能同步器
 * 从技能源同步数据并构建索引
 */
import { Source, SkillDetail, SkillMD, VersionInfo } from '../types/source';
import { IndexBuilder, IndexItem } from './index-builder';

/**
 * 同步配置
 */
export interface SyncConfig {
  /**
   * 是否增量同步
   */
  incremental?: boolean;

  /**
   * 每批次处理的技能数量
   */
  batchSize?: number;

  /**
   * 是否包含版本信息
   */
  includeVersions?: boolean;

  /**
   * 是否验证 SKILL.md
   */
  validateSkillMD?: boolean;

  /**
   * 并发数
   */
  concurrency?: number;
}

/**
 * 同步结果
 */
export interface SyncResult {
  /**
   * 成功数量
   */
  success: number;

  /**
   * 失败数量
   */
  failed: number;

  /**
   * 跳过数量
   */
  skipped: number;

  /**
   * 构建的索引项
   */
  indices: IndexItem[];

  /**
   * 错误列表
   */
  errors: Array<{
    skillId: string;
    error: string;
  }>;

  /**
   * 开始时间
   */
  startedAt: Date;

  /**
   * 结束时间
   */
  endedAt: Date;

  /**
   * 总耗时（毫秒）
   */
  duration: number;
}

/**
 * 同步器
 */
export class Syncer {
  private source: Source;
  private indexBuilder: IndexBuilder;

  constructor(source: Source) {
    this.source = source;
    this.indexBuilder = new IndexBuilder();
  }

  /**
   * 执行同步
   * @param config 同步配置
   */
  async sync(config: SyncConfig = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      indices: [],
      errors: [],
      startedAt: new Date(),
      endedAt: new Date(),
      duration: 0,
    };

    const concurrency = config.concurrency || 5;
    const batchSize = config.batchSize || 10;

    try {
      // 1. 列出技能
      console.log(`🔍 Listing skills from ${this.source.name()}...`);
      const skills = await this.source.listSkills({ size: 100 });
      console.log(`✅ Found ${skills.length} skills`);

      // 2. 分批处理
      const batches = this.chunkArray(skills, batchSize);

      for (const batch of batches) {
        console.log(`\n📦 Processing batch of ${batch.length} skills...`);

        // 并发处理批次
        const promises = batch.map((skill) =>
          this.processSkill(skill, config).catch((error) => {
            result.errors.push({
              skillId: skill.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            result.failed++;
            return null;
          })
        );

        const batchResults = await Promise.all(promises);

        // 统计结果
        for (const index of batchResults) {
          if (index) {
            result.indices.push(index);
            result.success++;
          }
        }

        console.log(`✅ Batch completed: ${result.success} success, ${result.failed} failed`);
      }

      result.endedAt = new Date();
      result.duration = Date.now() - startTime;

      // 3. 打印统计
      this.printStats(result);

      return result;
    } catch (error) {
      result.endedAt = new Date();
      result.duration = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * 处理单个技能
   */
  private async processSkill(
    skillInfo: any,
    config: SyncConfig
  ): Promise<IndexItem | null> {
    try {
      console.log(`  📖 Fetching ${skillInfo.id}...`);

      // 1. 获取技能详情
      const skill = await this.source.getSkill(skillInfo.id);

      // 2. 获取 SKILL.md
      const skillMD = await this.source.getSkillMD(skill.id);

      // 3. 验证 SKILL.md
      if (config.validateSkillMD) {
        // TODO: 实现验证逻辑
      }

      // 4. 获取版本列表
      let versions: VersionInfo[] = [];
      if (config.includeVersions) {
        try {
          versions = await this.source.listVersions(skill.id);
        } catch (error) {
          console.log(`    ⚠️  Failed to fetch versions for ${skill.id}`);
        }
      }

      // 5. 构建索引
      const index = this.indexBuilder.buildIndex(skill, skillMD, versions);

      console.log(`  ✅ ${skill.id} indexed`);
      return index;
    } catch (error) {
      throw new Error(`Failed to process ${skillInfo.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 分块数组
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 打印统计信息
   */
  private printStats(result: SyncResult): void {
    const stats = this.indexBuilder.getStats(result.indices);

    console.log('\n' + '='.repeat(60));
    console.log('📊 Sync Statistics');
    console.log('='.repeat(60));
    console.log(`✅ Success:  ${result.success}`);
    console.log(`❌ Failed:   ${result.failed}`);
    console.log(`⏭️  Skipped:  ${result.skipped}`);
    console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log('\n📈 Index Stats:');
    console.log(`  Total Skills: ${stats.total}`);
    console.log(`  Total Stars: ${stats.totalStars}`);
    console.log(`  Total Downloads: ${stats.totalDownloads}`);
    console.log('\n📂 Categories:');
    for (const [category, count] of Object.entries(stats.byCategory)) {
      console.log(`  ${category}: ${count}`);
    }
    console.log('\n🔌 Compatibility:');
    for (const [compat, count] of Object.entries(stats.byCompatibility)) {
      console.log(`  ${compat}: ${count}`);
    }
    console.log('='.repeat(60) + '\n');
  }
}