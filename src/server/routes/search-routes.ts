/**
 * 搜索 API 路由
 */
import type { FastifyInstance } from 'fastify';
import { getDb } from '../../core/db';

/**
 * 注册搜索路由
 */
export async function registerSearchRoutes(fastify: FastifyInstance): Promise<void> {
  // 全文搜索
  fastify.get('/search', async (request) => {
    const { q, query, page, pageSize } = request.query as Record<string, string>;
    const searchQuery = q || query || '';
    const pageNum = parseInt(page ?? '1', 10);
    const size = parseInt(pageSize ?? '20', 10);
    const offset = (pageNum - 1) * size;

    const db = getDb();

    if (!searchQuery) {
      // Return all skills if no query
      const skills = await db.selectFrom('skills').selectAll().limit(size).offset(offset).execute();
      const countResult = await db.selectFrom('skills').select(db.fn.countAll().as('count')).executeTakeFirst();
      const total = Number(countResult?.count ?? 0);
      return { data: skills, meta: { total, page: pageNum, pageSize: size, totalPages: Math.ceil(total / size) } };
    }

    // Text search using ILIKE
    const skills = await db.selectFrom('skills').selectAll()
      .where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${searchQuery}%`),
          eb('description', 'ilike', `%${searchQuery}%`),
          eb('namespace', 'ilike', `%${searchQuery}%`),
        ])
      )
      .limit(size)
      .offset(offset)
      .execute();

    return { data: skills, meta: { total: skills.length, page: pageNum, pageSize: size, query: searchQuery } };
  });

  // 语义搜索 (placeholder)
  fastify.post('/search/semantic', async (request) => {
    const { query, limit } = request.body as { query?: string; limit?: number };
    return {
      data: [],
      meta: { query: query ?? '', limit: limit ?? 10, note: 'Semantic search requires embedding configuration' },
    };
  });

  // 技能推荐
  fastify.get('/recommendations/:skillId', async (request) => {
    const { skillId } = request.params as { skillId: string };
    const db = getDb();
    // Simple: return other skills as recommendations
    const skills = await db.selectFrom('skills').selectAll().where('id', '!=', skillId).limit(5).execute();
    return { data: skills };
  });

  // 搜索统计
  fastify.get('/search/stats', async () => {
    const db = getDb();
    const countResult = await db.selectFrom('skills').select(db.fn.countAll().as('count')).executeTakeFirst();
    return {
      totalDocuments: Number(countResult?.count ?? 0),
      indexSize: 0,
      lastUpdated: new Date().toISOString(),
    };
  });

  // 趋势技能
  fastify.get('/search/trending', async () => {
    const db = getDb();
    const skills = await db.selectFrom('skills').selectAll().orderBy('downloads', 'desc').limit(10).execute();
    return { data: skills };
  });
}
