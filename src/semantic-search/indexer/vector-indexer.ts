/**
 * 向量索引器
 * 管理向量存储和检索
 */
import { VectorDocument, SkillData } from '../types/search';
import { EmbeddingClient } from '../embedder/embedding-client';

/**
 * 索引配置
 */
export interface IndexConfig {
  /**
   * 索引容量
   */
  capacity?: number;

  /**
   * 索引路径（持久化）
   */
  indexPath?: string;
}

/**
 * 向量索引器
 */
export class VectorIndexer {
  private documents: Map<string, VectorDocument>;
  private embeddingClient: EmbeddingClient;
  private config: IndexConfig;

  constructor(config: IndexConfig = {}) {
    this.documents = new Map();
    this.embeddingClient = new EmbeddingClient();
    this.config = {
      capacity: config.capacity || 10000,
      indexPath: config.indexPath,
    };
  }

  /**
   * 添加文档
   * @param id 文档ID
   * @param text 文本内容
   * @param metadata 元数据
   */
  async addDocument(id: string, text: string, metadata: Record<string, any>): Promise<void> {
    const vector = await this.embeddingClient.embed(text);

    const document: VectorDocument = {
      id,
      vector,
      metadata,
    };

    this.documents.set(id, document);
  }

  /**
   * 批量添加文档
   * @param items 文档数组
   */
  async addDocuments(items: Array<{
    id: string;
    text: string;
    metadata: Record<string, any>;
  }>): Promise<void> {
    const texts = items.map((item) => item.text);
    const vectors = await this.embeddingClient.embedBatch(texts);

    for (let i = 0; i < items.length; i++) {
      const document: VectorDocument = {
        id: items[i].id,
        vector: vectors[i],
        metadata: items[i].metadata,
      };

      this.documents.set(items[i].id, document);
    }
  }

  /**
   * 删除文档
   * @param id 文档ID
   */
  deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  /**
   * 更新文档
   * @param id 文档ID
   * @param text 新文本
   * @param metadata 新元数据
   */
  async updateDocument(id: string, text: string, metadata: Record<string, any>): Promise<void> {
    await this.deleteDocument(id);
    await this.addDocument(id, text, metadata);
  }

  /**
   * 获取文档
   * @param id 文档ID
   */
  getDocument(id: string): VectorDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * 获取所有文档
   */
  getAllDocuments(): VectorDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * 搜索最相似的文档
   * @param query 查询文本
   * @param topK 返回数量
   */
  async search(query: string, topK: number = 10): Promise<Array<{
    document: VectorDocument;
    score: number;
  }>> {
    const queryVector = await this.embeddingClient.embed(query);

    const results: Array<{
      document: VectorDocument;
      score: number;
    }> = [];

    for (const document of this.documents.values()) {
      const score = this.embeddingClient.cosineSimilarity(queryVector, document.vector);
      results.push({ document, score });
    }

    // 按相似度排序
    results.sort((a, b) => b.score - a.score);

    // 返回 topK 结果
    return results.slice(0, topK);
  }

  /**
   * 获取索引统计
   */
  getStats(): {
    totalDocuments: number;
    indexSize: number;
    averageVectorLength: number;
  } {
    const documents = Array.from(this.documents.values());
    const indexSize = documents.length;

    let totalLength = 0;
    for (const doc of documents) {
      totalLength += doc.vector.length;
    }

    return {
      totalDocuments: indexSize,
      indexSize: indexSize * 4, // float32 = 4 bytes
      averageVectorLength: indexSize > 0 ? totalLength / indexSize : 0,
    };
  }

  /**
   * 清空索引
   */
  clear(): void {
    this.documents.clear();
  }

  /**
   * 构建技能索引
   * @param skills 技能列表
   */
  async buildSkillIndex(skills: SkillData[]): Promise<void> {
    const items = skills.map((skill) => ({
      id: skill.id,
      text: this.generateSkillText(skill),
      metadata: skill,
    }));

    await this.addDocuments(items);
  }

  /**
   * 生成技能文本
   */
  private generateSkillText(skill: SkillData): string {
    const parts = [
      skill.name,
      skill.description,
      ...skill.keywords,
      ...skill.categories,
    ];

    return parts.join(' ');
  }

  /**
   * 持久化索引
   */
  async saveIndex(): Promise<void> {
    if (!this.config.indexPath) {
      throw new Error('Index path not configured');
    }

    // TODO: 实现持久化逻辑
    console.log('Saving index to:', this.config.indexPath);
  }

  /**
   * 加载索引
   */
  async loadIndex(): Promise<void> {
    if (!this.config.indexPath) {
      throw new Error('Index path not configured');
    }

    // TODO: 实现加载逻辑
    console.log('Loading index from:', this.config.indexPath);
  }
}