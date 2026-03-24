/**
 * 依赖解析器
 * 解析技能依赖关系，构建依赖树，检测循环依赖和冲突
 */
import semver from 'semver';
import toposort from 'toposort';
import {
  Dependency,
  DependencyItem,
  SkillMetadata,
  DependencyTreeNode,
  DependencyConflict,
  ResolutionResult,
  ResolutionOptions,
} from '../types/dependency';

/**
 * 依赖解析器
 */
export class DependencyResolver {
  private skillRegistry: Map<string, SkillMetadata[]>;
  private visited: Set<string>;

  constructor() {
    this.skillRegistry = new Map();
    this.visited = new Set();
  }

  /**
   * 注册技能元数据
   * @param skill 技能元数据
   */
  registerSkill(skill: SkillMetadata): void {
    const versions = this.skillRegistry.get(skill.id) || [];
    versions.push(skill);
    this.skillRegistry.set(skill.id, versions);
  }

  /**
   * 批量注册技能
   * @param skills 技能元数据列表
   */
  registerSkills(skills: SkillMetadata[]): void {
    for (const skill of skills) {
      this.registerSkill(skill);
    }
  }

  /**
   * 解析依赖
   * @param rootSkillId 根技能ID
   * @param rootVersion 根技能版本
   * @param options 解析选项
   */
  async resolve(
    rootSkillId: string,
    rootVersion: string,
    options: ResolutionOptions = {}
  ): Promise<ResolutionResult> {
    this.visited.clear();

    const result: ResolutionResult = {
      tree: {
        skillId: rootSkillId,
        version: rootVersion,
        depth: 0,
        children: [],
        dependency: { name: rootSkillId, version: rootVersion },
      },
      flattened: [],
      conflicts: [],
      success: false,
    };

    try {
      // 1. 构建依赖树
      await this.buildDependencyTree(result.tree, options);

      // 2. 检测循环依赖
      const circular = this.detectCircularDependencies(result.tree);
      if (circular.length > 0) {
        result.conflicts.push({
          skillId: 'circular',
          constraints: circular,
          message: `Circular dependencies detected: ${circular.join(' -> ')}`,
        });
      }

      // 3. 扁平化依赖列表（拓扑排序）
      result.flattened = this.flattenDependencies(result.tree);

      // 4. 检测版本冲突
      const conflicts = this.detectVersionConflicts(result.flattened);
      result.conflicts.push(...conflicts);

      result.success = result.conflicts.length === 0;

      if (!result.success) {
        result.error = `Found ${result.conflicts.length} conflict(s)`;
      }
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  /**
   * 构建依赖树
   */
  private async buildDependencyTree(
    node: DependencyTreeNode,
    options: ResolutionOptions
  ): Promise<void> {
    // 检查最大深度
    if (options.maxDepth !== undefined && node.depth >= options.maxDepth) {
      return;
    }

    // 检查循环依赖
    const path = this.getDependencyPath(node);
    if (path.has(node.skillId)) {
      node.isCircular = true;
      return;
    }

    // 获取技能元数据
    const skillVersions = this.skillRegistry.get(node.skillId);
    if (!skillVersions || skillVersions.length === 0) {
      return;
    }

    // 选择最佳版本
    const skill = this.selectVersion(skillVersions, node.dependency.version);

    // 解析依赖项
    for (const dep of skill.dependencies) {
      const depNode: DependencyTreeNode = {
        skillId: dep.name,
        version: dep.version || 'latest',
        depth: node.depth + 1,
        parent: node,
        children: [],
        dependency: dep,
      };

      // 递归解析
      if (options.transitive !== false) {
        await this.buildDependencyTree(depNode, options);
      }

      node.children.push(depNode);
    }
  }

  /**
   * 获取依赖路径
   */
  private getDependencyPath(node: DependencyTreeNode): Set<string> {
    const path = new Set<string>();
    let current: DependencyTreeNode | undefined = node;

    while (current) {
      path.add(current.skillId);
      current = current.parent;
    }

    return path;
  }

  /**
   * 选择版本
   */
  private selectVersion(versions: SkillMetadata[], versionConstraint?: string): SkillMetadata {
    if (!versionConstraint || versionConstraint === 'latest') {
      // 选择最新版本
      return versions.sort((a, b) => semver.rcompare(a.version, b.version))[0];
    }

    // 匹配版本约束
    const matching = versions.filter((v) => semver.satisfies(v.version, versionConstraint));

    if (matching.length === 0) {
      // 没有匹配的版本，返回最新版本并标记错误
      const latest = versions.sort((a, b) => semver.rcompare(a.version, b.version))[0];
      return latest;
    }

    return matching.sort((a, b) => semver.rcompare(a.version, b.version))[0];
  }

  /**
   * 检测循环依赖
   */
  private detectCircularDependencies(root: DependencyTreeNode): string[] {
    const circular: string[] = [];

    const visit = (node: DependencyTreeNode, path: string[]): void => {
      const currentPath = [...path, node.skillId];

      // 检查是否循环
      const index = path.indexOf(node.skillId);
      if (index !== -1) {
        circular.push(...currentPath.slice(index));
        return;
      }

      for (const child of node.children) {
        visit(child, currentPath);
      }
    };

    visit(root, []);

    return circular;
  }

  /**
   * 扁平化依赖列表（拓扑排序）
   */
  private flattenDependencies(root: DependencyTreeNode): DependencyItem[] {
    const edges: [string, string][] = [];
    const nodes = new Set<string>();

    const visit = (node: DependencyTreeNode): void => {
      nodes.add(node.skillId);

      for (const child of node.children) {
        edges.push([node.skillId, child.skillId]);
        visit(child);
      }
    };

    visit(root);

    // 拓扑排序
    const sorted = toposort(edges);

    // 转换为 DependencyItem
    const items: DependencyItem[] = [];
    for (const skillId of sorted) {
      const versions = this.skillRegistry.get(skillId);
      if (versions && versions.length > 0) {
        const version = versions[versions.length - 1].version;
        items.push({
          name: skillId,
          version,
          resolved: true,
          resolvedVersion: version,
        });
      }
    }

    return items;
  }

  /**
   * 检测版本冲突
   */
  private detectVersionConflicts(items: DependencyItem[]): DependencyConflict[] {
    const conflicts: DependencyConflict[] = [];
    const versionMap = new Map<string, Set<string>>();

    // 统计每个技能的不同版本
    for (const item of items) {
      const versions = versionMap.get(item.name) || new Set();
      versions.add(item.version!);
      versionMap.set(item.name, versions);
    }

    // 检测冲突
    for (const [skillId, versions] of versionMap) {
      if (versions.size > 1) {
        conflicts.push({
          skillId,
          constraints: Array.from(versions),
          message: `Multiple versions found for ${skillId}: ${Array.from(versions).join(', ')}`,
        });
      }
    }

    return conflicts;
  }

  /**
   * 验证版本约束
   * @param version 版本
   * @param constraint 约束
   */
  validateConstraint(version: string, constraint: string): boolean {
    return semver.satisfies(version, constraint);
  }

  /**
   * 获取依赖图（DOT 格式）
   * @param root 依赖树根节点
   */
  getDependencyGraph(root: DependencyTreeNode): string {
    const lines: string[] = ['digraph dependencies {', '  node [shape=box];'];

    const visit = (node: DependencyTreeNode): void => {
      const label = `${node.skillId}@${node.version}`;
      lines.push(`  "${node.skillId}" [label="${label}"];`);

      for (const child of node.children) {
        lines.push(`  "${node.skillId}" -> "${child.skillId}";`);
        visit(child);
      }
    };

    visit(root);
    lines.push('}');

    return lines.join('\n');
  }
}