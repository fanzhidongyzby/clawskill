/**
 * 依赖定义
 */
export interface Dependency {
  /**
   * 依赖技能名称（格式：namespace/name）
   */
  name: string;

  /**
   * 版本约束（semver 范围）
   * 例如：^1.2.0, ~2.0.0, >=3.0.0, latest
   */
  version?: string;

  /**
   * 是否可选依赖
   */
  optional?: boolean;

  /**
   * 约束说明
   */
  constraint?: string;
}

/**
 * 依赖项（带解析信息）
 */
export interface DependencyItem extends Dependency {
  /**
   * 是否已解析
   */
  resolved?: boolean;

  /**
   * 解析后的版本
   */
  resolvedVersion?: string;

  /**
   * 错误信息（如果解析失败）
   */
  error?: string;
}

/**
 * 技能元数据
 */
export interface SkillMetadata {
  /**
   * 技能ID
   */
  id: string;

  /**
   * 名称
   */
  name: string;

  /**
   * 命名空间
   */
  namespace: string;

  /**
   * 版本
   */
  version: string;

  /**
   * 依赖列表
   */
  dependencies: Dependency[];
}

/**
 * 依赖树节点
 */
export interface DependencyTreeNode {
  /**
   * 技能ID
   */
  skillId: string;

  /**
   * 版本
   */
  version: string;

  /**
   * 深度（0为根）
   */
  depth: number;

  /**
   * 父节点
   */
  parent?: DependencyTreeNode;

  /**
   * 子节点
   */
  children: DependencyTreeNode[];

  /**
   * 依赖项
   */
  dependency: Dependency;

  /**
   * 是否循环依赖
   */
  isCircular?: boolean;
}

/**
 * 依赖冲突
 */
export interface DependencyConflict {
  /**
   * 冲突的技能ID
   */
  skillId: string;

  /**
   * 冲突的版本约束
   */
  constraints: string[];

  /**
   * 冲突描述
   */
  message: string;
}

/**
 * 解析结果
 */
export interface ResolutionResult {
  /**
   * 依赖树
   */
  tree: DependencyTreeNode;

  /**
   * 扁平化的依赖列表（安装顺序）
   */
  flattened: DependencyItem[];

  /**
   * 冲突列表
   */
  conflicts: DependencyConflict[];

  /**
   * 是否成功
   */
  success: boolean;

  /**
   * 错误信息
   */
  error?: string;
}

/**
 * 版本解析选项
 */
export interface ResolutionOptions {
  /**
   * 是否解析传递依赖
   */
  transitive?: boolean;

  /**
   * 最大深度
   */
  maxDepth?: number;

  /**
   * 是否允许重复版本
   */
  allowDuplicates?: boolean;

  /**
   * 版本锁定策略
   */
  lockStrategy?: 'latest' | 'oldest' | 'exact';
}