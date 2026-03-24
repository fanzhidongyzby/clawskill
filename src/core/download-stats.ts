/**
 * 下载统计服务
 *
 * 记录和统计技能下载次数
 */

export interface DownloadRecord {
  id: string;
  skillId: string;
  version: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  downloadedAt: Date;
}

export interface DownloadStats {
  skillId: string;
  totalDownloads: number;
  downloadsByVersion: Record<string, number>;
  downloadsLast7Days: number;
  downloadsLast30Days: number;
  downloadsLast90Days: number;
}

export interface TrendingSkill {
  skillId: string;
  name: string;
  namespace: string;
  downloads: number;
  growth: number; // 增长百分比
  period: '7d' | '30d' | '90d';
}

export class DownloadStatsService {
  /**
   * 记录下载
   */
  async recordDownload(params: {
    skillId: string;
    version: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<DownloadRecord> {
    const record: DownloadRecord = {
      id: this.generateId(),
      skillId: params.skillId,
      version: params.version,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      downloadedAt: new Date(),
    };

    // TODO: 存储到数据库
    // await this.db.insert('skill_downloads', record);

    console.log(`📊 下载记录: ${params.skillId}@${params.version} by ${params.userId || 'anonymous'}`);

    return record;
  }

  /**
   * 获取技能下载统计
   */
  async getDownloadStats(skillId: string): Promise<DownloadStats> {
    // TODO: 从数据库查询
    // const downloads = await this.db.query('skill_downloads', { skillId });

    // 模拟数据
    const stats: DownloadStats = {
      skillId,
      totalDownloads: Math.floor(Math.random() * 10000),
      downloadsByVersion: {
        '1.0.0': Math.floor(Math.random() * 5000),
        '1.1.0': Math.floor(Math.random() * 3000),
        '2.0.0': Math.floor(Math.random() * 2000),
      },
      downloadsLast7Days: Math.floor(Math.random() * 500),
      downloadsLast30Days: Math.floor(Math.random() * 2000),
      downloadsLast90Days: Math.floor(Math.random() * 5000),
    };

    return stats;
  }

  /**
   * 获取热门技能
   */
  async getTrendingSkills(options: {
    period?: '7d' | '30d' | '90d';
    limit?: number;
    category?: string;
  }): Promise<TrendingSkill[]> {
    const { period = '7d', limit = 10, category } = options;

    // TODO: 从数据库查询
    // const skills = await this.db.query('skills', { category });
    // const stats = await this.getDownloadStatsForSkills(skills);

    // 模拟数据
    const trending: TrendingSkill[] = Array.from({ length: limit }, (_, i) => ({
      skillId: `openclaw/skill-${i + 1}`,
      name: `skill-${i + 1}`,
      namespace: 'openclaw',
      downloads: Math.floor(Math.random() * 10000),
      growth: Math.floor(Math.random() * 100) - 20, // -20% to 80%
      period,
    }));

    return trending.sort((a, b) => b.growth - a.growth);
  }

  /**
   * 获取用户的下载历史
   */
  async getUserDownloads(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<DownloadRecord[]> {
    const { limit = 20, offset = 0 } = options || {};

    // TODO: 从数据库查询
    // const downloads = await this.db.query('skill_downloads', { userId }, { limit, offset });

    // 模拟数据
    const downloads: DownloadRecord[] = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: this.generateId(),
      skillId: `openclaw/skill-${i + 1}`,
      version: '1.0.0',
      userId,
      downloadedAt: new Date(Date.now() - i * 86400000),
    }));

    return downloads;
  }

  /**
   * 删除下载记录（隐私保护）
   */
  async deleteUserDownloads(userId: string): Promise<void> {
    // TODO: 从数据库删除
    // await this.db.delete('skill_downloads', { userId });

    console.log(`🗑️ 删除用户 ${userId} 的下载记录`);
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 导出单例
export const downloadStatsService = new DownloadStatsService();