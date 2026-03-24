/**
 * 技能源接口定义
 * 所有技能源必须实现此接口
 */
export interface Source {
  /**
   * 获取源标识
   */
  id(): string;

  /**
   * 获取源名称
   */
  name(): string;

  /**
   * 列出技能
   * @param opts 列表选项
   */
  listSkills(opts: ListOptions): Promise<SkillInfo[]>;

  /**
   * 获取技能详情
   * @param skillId 技能ID
   */
  getSkill(skillId: string): Promise<SkillDetail>;

  /**
   * 获取技能版本列表
   * @param skillId 技能ID
   */
  listVersions(skillId: string): Promise<VersionInfo[]>;

  /**
   * 获取 SKILL.md 内容
   * @param skillId 技能ID
   * @param version 版本号
   */
  getSkillMD(skillId: string, version: string): Promise<SkillMD>;

  /**
   * 监听变更事件
   */
  watch?(): AsyncIterable<SourceEvent>;
}

/**
 * 列表选项
 */
export interface ListOptions {
  /**
   * 页码（从1开始）
   */
  page?: number;

  /**
   * 每页数量
   */
  size?: number;

  /**
   * 搜索关键词
   */
  query?: string;

  /**
   * 排序方式
   */
  sort?: 'stars' | 'updated' | 'created';

  /**
   * 语言过滤
   */
  language?: string;
}

/**
 * 技能信息（列表项）
 */
export interface SkillInfo {
  /**
   * 技能ID
   */
  id: string;

  /**
   * 技能名称
   */
  name: string;

  /**
   * 命名空间
   */
  namespace: string;

  /**
   * 描述
   */
  description: string;

  /**
   * 作者
   */
  author: string;

  /**
   * Stars 数量
   */
  stars: number;

  /**
   * 最后更新时间
   */
  updatedAt: Date;

  /**
   * 编程语言
   */
  language?: string;
}

/**
 * 技能详情
 */
export interface SkillDetail extends SkillInfo {
  /**
   * 仓库地址
   */
  repository: string;

  /**
   * 主页地址
   */
  homepage?: string;

  /**
   * 许可证
   */
  license?: string;

  /**
   * 关键词
   */
  keywords: string[];

  /**
   * 分类
   */
  categories: string[];

  /**
   * 最新版本
   */
  latestVersion?: string;

  /**
   * 下载次数
   */
  downloads: number;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 默认分支
   */
  defaultBranch: string;
}

/**
 * 版本信息
 */
export interface VersionInfo {
  /**
   * 版本号（git tag 或 semver）
   */
  version: string;

  /**
   * 版本描述
   */
  description?: string;

  /**
   * 发布时间
   */
  publishedAt: Date;

  /**
   * 是否为预发布版本
   */
  isPreRelease: boolean;

  /**
   * 提交 SHA
   */
  commitSha: string;
}

/**
 * SKILL.md 内容
 */
export interface SkillMD {
  /**
   * 原始内容（Markdown）
   */
  raw: string;

  /**
   * 解析后的 Frontmatter
   */
  frontmatter: Record<string, any>;

  /**
   * 技能元数据（从 frontmatter 提取）
   */
  metadata: SkillMetadata;

  /**
   * 下载地址
   */
  downloadUrl: string;

  /**
   * 内容哈希（SHA256）
   */
  hash?: string;
}

/**
 * 技能元数据
 */
export interface SkillMetadata {
  /**
   * 技能名称
   */
  name: string;

  /**
   * 技能描述
   */
  description: string;

  /**
   * 版本
   */
  version?: string;

  /**
   * 作者
   */
  author?: string;

  /**
   * 触发关键词
   */
  triggers?: string[];

  /**
   * 所需工具
   */
  tools?: string[];

  /**
   * 兼容平台
   */
  compatibility?: string[];

  /**
   * 关键词
   */
  keywords?: string[];

  /**
   * 分类
   */
  categories?: string[];
}

/**
 * 源事件
 */
export interface SourceEvent {
  /**
   * 事件类型
   */
  type: 'skill_added' | 'skill_updated' | 'skill_deleted' | 'version_published';

  /**
   * 技能ID
   */
  skillId: string;

  /**
   * 事件时间
   */
  timestamp: Date;

  /**
   * 事件数据
   */
  data?: any;
}