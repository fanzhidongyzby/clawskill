/**
 * 向量嵌入器
 * 将文本转换为向量表示
 */
import axios from 'axios';
import { EmbeddingConfig } from '../types/search';

/**
 * Embedding 响应
 */
interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * 向量嵌入器
 */
export class EmbeddingClient {
  private config: Required<EmbeddingConfig>;
  private client: any;

  constructor(config: EmbeddingConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'text-embedding-ada-002',
      endpoint: config.endpoint || 'https://api.openai.com/v1/embeddings',
      dimensions: config.dimensions || 1536,
    };

    this.client = axios.create({
      baseURL: this.config.endpoint,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 嵌入单个文本
   * @param text 输入文本
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.client.post<EmbeddingResponse>('', {
      model: this.config.model,
      input: text,
    });

    return response.data.data[0].embedding;
  }

  /**
   * 批量嵌入
   * @param texts 文本数组
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.post<EmbeddingResponse>('', {
      model: this.config.model,
      input: texts,
    });

    return response.data.data.map((item) => item.embedding);
  }

  /**
   * 计算余弦相似度
   * @param vec1 向量1
   * @param vec2 向量2
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 计算欧氏距离
   * @param vec1 向量1
   * @param vec2 向量2
   */
  euclideanDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      const diff = vec1[i] - vec2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * 计算点积
   * @param vec1 向量1
   * @param vec2 向量2
   */
  dotProduct(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      sum += vec1[i] * vec2[i];
    }

    return sum;
  }

  /**
   * 生成技能向量文本
   * @param skill 技能数据
   */
  generateSkillVectorText(skill: {
    name: string;
    description: string;
    keywords: string[];
    categories: string[];
  }): string {
    const parts = [
      skill.name,
      skill.description,
      ...skill.keywords,
      ...skill.categories,
    ];

    return parts.join(' ');
  }

  /**
   * 向量归一化
   * @param vector 向量
   */
  normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;

    return vector.map((val) => val / norm);
  }
}