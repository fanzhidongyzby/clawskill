import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 技能相关 API
export const skillsApi = {
  // 获取技能列表
  list: (params?: { page?: number; size?: number; sort?: string }) =>
    api.get('/skills', { params }),

  // 搜索技能
  search: (query: string, params?: any) =>
    api.get('/search', { params: { q: query, ...params } }),

  // 获取技能详情
  get: (namespace: string, name: string) =>
    api.get(`/skills/${namespace}/${name}`),

  // 获取技能版本
  getVersions: (namespace: string, name: string) =>
    api.get(`/skills/${namespace}/${name}/versions`),

  // 获取 SKILL.md
  getSkillMD: (namespace: string, name: string, version?: string) =>
    api.get(`/skills/${namespace}/${name}/skillmd`, { params: { version } }),

  // 获取安装命令
  getInstallCommand: (namespace: string, name: string, platform: string) =>
    api.get(`/skills/${namespace}/${name}/install`, { params: { platform } }),
};

// 用户相关 API
export const userApi = {
  // 获取用户信息
  getProfile: () => api.get('/user/profile'),

  // 获取已安装技能
  getInstalledSkills: () => api.get('/user/skills/installed'),

  // 安装技能
  installSkill: (skillId: string, version: string) =>
    api.post('/user/skills/install', { skillId, version }),

  // 卸载技能
  uninstallSkill: (skillId: string) =>
    api.delete(`/user/skills/${skillId}`),

  // 更新技能
  updateSkill: (skillId: string, version: string) =>
    api.put(`/user/skills/${skillId}`, { version }),
};

export default api;