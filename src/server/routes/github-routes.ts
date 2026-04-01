/**
 * GitHub 集成 API 路由
 */
import type { FastifyInstance } from 'fastify';
import { GitHubSource } from '../../github/sources/github-source';

const githubSource = new GitHubSource({
  token: process.env.GITHUB_TOKEN,
});

/**
 * 注册 GitHub 路由
 */
export async function registerGitHubRoutes(fastify: FastifyInstance): Promise<void> {
  // 获取 GitHub 技能列表
  fastify.get('/github/skills', async (request) => {
    const { topic, language, minStars } = request.query as Record<string, string>;

    const options: any = {};
    if (topic) options.topic = topic;
    if (language) options.language = language;
    if (minStars) options.minStars = parseInt(minStars, 10);

    const skills = await githubSource.listSkills(options);
    return { data: skills };
  });

  // 获取技能详情
  fastify.get('/github/skills/:owner/:repo', async (request) => {
    const { owner, repo } = request.params as { owner: string; repo: string };

    const skill = await githubSource.getSkill(`${owner}/${repo}`);
    return skill;
  });

  // 获取 SKILL.md 内容
  fastify.get('/github/skills/:owner/:repo/skill-md', async (request) => {
    const { owner, repo } = request.params as { owner: string; repo: string };

    const skillMd = await githubSource.getSkillMD(`${owner}/${repo}`);
    return skillMd;
  });

  // 同步技能
  fastify.post('/github/sync', async (request) => {
    const { owner, repo } = request.body as { owner?: string; repo?: string };

    if (owner && repo) {
      // 同步单个技能
      const result = await githubSource.getSkill(`${owner}/${repo}`);
      return result;
    } else {
      // 同步所有技能
      const result = await githubSource.listSkills();
      return result;
    }
  });

  // 获取版本列表
  fastify.get('/github/skills/:owner/:repo/versions', async (request) => {
    const { owner, repo } = request.params as { owner: string; repo: string };

    const versions = await githubSource.listVersions(`${owner}/${repo}`);
    return { data: versions };
  });
}