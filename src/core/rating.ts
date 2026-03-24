/**
 * 星级评分服务
 *
 * 用户可给技能打分（1-5 星）
 */

export interface Rating {
  id: string;
  skillId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RatingSummary {
  skillId: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface RatingStats {
  skillId: string;
  averageRating: number;
  totalRatings: number;
  recentRatings: Rating[];
  topPositiveComments: string[];
  topNegativeComments: string[];
}

export class RatingService {
  /**
   * 创建评分
   */
  async createRating(params: {
    skillId: string;
    userId: string;
    rating: number; // 1-5
    comment?: string;
  }): Promise<Rating> {
    // 验证评分范围
    if (params.rating < 1 || params.rating > 5) {
      throw new Error('评分必须在 1-5 之间');
    }

    const rating: Rating = {
      id: this.generateId(),
      skillId: params.skillId,
      userId: params.userId,
      rating: params.rating,
      comment: params.comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // TODO: 存储到数据库
    // await this.db.insert('skill_ratings', rating);

    console.log(`⭐ ${params.userId} 给 ${params.skillId} 打了 ${params.rating} 星`);

    return rating;
  }

  /**
   * 更新评分
   */
  async updateRating(
    ratingId: string,
    updates: {
      rating?: number;
      comment?: string;
    }
  ): Promise<Rating> {
    // TODO: 更新数据库
    // const existing = await this.db.query('skill_ratings', { id: ratingId });
    // const updated = { ...existing, ...updates, updatedAt: new Date() };
    // await this.db.update('skill_ratings', ratingId, updated);

    console.log(`🔄 更新评分: ${ratingId}`);

    // 返回模拟数据
    return {
      id: ratingId,
      skillId: 'openclaw/test-skill',
      userId: 'user-123',
      rating: updates.rating || 5,
      comment: updates.comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 删除评分
   */
  async deleteRating(ratingId: string): Promise<void> {
    // TODO: 从数据库删除
    // await this.db.delete('skill_ratings', { id: ratingId });

    console.log(`🗑️ 删除评分: ${ratingId}`);
  }

  /**
   * 获取技能的所有评分
   */
  async getRatings(skillId: string, options?: {
    limit?: number;
    offset?: number;
    sort?: 'recent' | 'helpful';
  }): Promise<Rating[]> {
    const { limit = 20, offset = 0, sort = 'recent' } = options || {};

    // TODO: 从数据库查询
    // let query = this.db.query('skill_ratings', { skillId });
    // if (sort === 'recent') query = query.orderBy('createdAt', 'desc');
    // if (sort === 'helpful') query = query.orderBy('helpful', 'desc');
    // const ratings = await query.limit(limit).offset(offset);

    // 模拟数据
    const ratings: Rating[] = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: this.generateId(),
      skillId,
      userId: `user-${i + 1}`,
      rating: Math.floor(Math.random() * 5) + 1,
      comment: [
        '非常棒的技能！',
        '很好用，推荐！',
        '还可以，有待改进',
        '不错，但有些bug',
        '非常好用，节省了很多时间',
      ][i % 5],
      createdAt: new Date(Date.now() - i * 86400000 * 7),
      updatedAt: new Date(),
    }));

    return ratings;
  }

  /**
   * 获取用户的评分
   */
  async getUserRatings(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<Rating[]> {
    const { limit = 20, offset = 0 } = options || {};

    // TODO: 从数据库查询
    // const ratings = await this.db.query('skill_ratings', { userId }, { limit, offset });

    // 模拟数据
    const ratings: Rating[] = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: this.generateId(),
      skillId: `openclaw/skill-${i + 1}`,
      userId,
      rating: Math.floor(Math.random() * 5) + 1,
      createdAt: new Date(Date.now() - i * 86400000 * 30),
      updatedAt: new Date(),
    }));

    return ratings;
  }

  /**
   * 获取评分摘要
   */
  async getRatingSummary(skillId: string): Promise<RatingSummary> {
    // TODO: 从数据库聚合查询
    // const ratings = await this.db.query('skill_ratings', { skillId });
    // const summary = this.calculateSummary(ratings);

    // 模拟数据
    const totalRatings = Math.floor(Math.random() * 1000);
    const distribution = {
      1: Math.floor(totalRatings * 0.1),
      2: Math.floor(totalRatings * 0.15),
      3: Math.floor(totalRatings * 0.25),
      4: Math.floor(totalRatings * 0.3),
      5: Math.floor(totalRatings * 0.2),
    };

    const averageRating =
      (1 * distribution[1] +
        2 * distribution[2] +
        3 * distribution[3] +
        4 * distribution[4] +
        5 * distribution[5]) /
      totalRatings;

    const summary: RatingSummary = {
      skillId,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings,
      ratingDistribution: distribution,
    };

    return summary;
  }

  /**
   * 获取评分统计
   */
  async getRatingStats(skillId: string): Promise<RatingStats> {
    const ratings = await this.getRatings(skillId, { limit: 100 });
    const summary = await this.getRatingSummary(skillId);

    // 提取评论
    const positiveComments = ratings
      .filter((r) => r.rating >= 4 && r.comment)
      .map((r) => r.comment!)
      .slice(0, 5);

    const negativeComments = ratings
      .filter((r) => r.rating <= 2 && r.comment)
      .map((r) => r.comment!)
      .slice(0, 5);

    return {
      skillId,
      averageRating: summary.averageRating,
      totalRatings: summary.totalRatings,
      recentRatings: ratings.slice(0, 10),
      topPositiveComments: positiveComments,
      topNegativeComments: negativeComments,
    };
  }

  /**
   * 检查用户是否已评分
   */
  async hasRated(skillId: string, userId: string): Promise<boolean> {
    // TODO: 查询数据库
    // const rating = await this.db.queryOne('skill_ratings', { skillId, userId });
    // return !!rating;

    // 模拟
    return false;
  }

  /**
   * 获取用户的评分
   */
  async getUserRating(skillId: string, userId: string): Promise<Rating | null> {
    // TODO: 查询数据库
    // const rating = await this.db.queryOne('skill_ratings', { skillId, userId });
    // return rating || null;

    // 模拟
    return null;
  }

  /**
   * 计算评分摘要
   */
  private calculateSummary(ratings: Rating[]): RatingSummary {
    if (ratings.length === 0) {
      return {
        skillId: '',
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => {
      distribution[r.rating as keyof typeof distribution]++;
    });

    return {
      skillId: ratings[0].skillId,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings: ratings.length,
      ratingDistribution: distribution,
    };
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 导出单例
export const ratingService = new RatingService();