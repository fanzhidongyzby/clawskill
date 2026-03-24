/**
 * 搜索 API 路由
 */
import type { FastifyInstance } from 'fastify';
import { SemanticSearcher } from '../../semantic-search/searcher/semantic-searcher';

const searcher = new SemanticSearcher();

/**
 * 注册搜索路由
 */
export async function registerSearchRoutes(fastify: FastifyInstance): Promise<void> {
  // 全文搜索
  fastify.get('/search', async (request) => {
    const { query, page, pageSize } = request.query as Record<string, string>;

    const result = await searcher.search({
      query: query ?? '',
      page: parseInt(page ?? '1', 10),
      pageSize: parseInt(pageSize ?? '20', 10),
    });

    return result;
  });

  // 语义搜索
  fastify.post('/search/semantic', async (request) => {
    const { query, limit } = request.body as { query?: string; limit?: number };

    const result = await searcher.semanticSearch({
      query: query ?? '',
      limit: limit ?? 10,
    });

    return result;
  });

  // 技能推荐
  fastify.get('/recommendations/:skillId', async (request) => {
    const { skillId } = request.params as { skillId: string };

    const recommendations = await searcher.recommend(skillId);
    return { data: recommendations };
  });

  // 搜索统计
  fastify.get('/search/stats', async () => {
    const stats = await searcher.getStats();
    return stats;
  });

  // 趋势技能
  fastify.get('/search/trending', async () => {
    const trending = await searcher.getTrending();
    return { data: trending };
  });
}