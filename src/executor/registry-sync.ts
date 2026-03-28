/**
 * Registry Sync - CLI-Hub 注册表同步
 * 
 * 同步 CLI-Anything registry.json 到本地缓存
 * 支持 ClawHub 索引合并
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const CLI_HUB_REGISTRY_URL = 'https://hkuds.github.io/CLI-Anything/registry.json';
const DEFAULT_CACHE_DIR = join(process.cwd(), '.clawskill', 'cache');

/**
 * CLI-Hub 注册表
 */
export interface CLIHubRegistry {
  meta: {
    repo: string;
    description: string;
    updated: string;
  };
  clis: CLIHubEntry[];
}

export interface CLIHubEntry {
  name: string;
  display_name: string;
  version: string;
  description: string;
  requires?: string;
  homepage?: string;
  install_cmd: string;
  entry_point: string;
  skill_md?: string | null;
  category: string;
  contributor?: string;
  contributor_url?: string;
}

/**
 * 合并后的注册表
 */
export interface MergedRegistry {
  version: string;
  updated: string;
  sources: {
    cli_anything: CLIHubRegistry;
    clawhub?: any; // Reserved for ClawHub integration
    custom?: any[];
  };
  skills: MergedSkillEntry[];
  categories: Record<string, number>;
}

export interface MergedSkillEntry {
  url: string;
  name: string;
  description: string;
  version: string;
  category: string;
  source: 'cli-anything' | 'clawhub' | 'custom';
  entryPoint?: string;
  installCmd?: string;
  skillMdPath?: string;
}

/**
 * 同步选项
 */
export interface SyncOptions {
  /** 缓存目录 */
  cacheDir?: string;
  
  /** 强制刷新 */
  force?: boolean;
  
  /** 包含 ClawHub */
  includeClawHub?: boolean;
}

/**
 * 注册表同步器
 */
export class RegistrySync {
  private cacheDir: string;
  private cache: CLIHubRegistry | null = null;
  
  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || DEFAULT_CACHE_DIR;
  }
  
  /**
   * 同步 CLI-Hub 注册表
   */
  async syncCLIHub(options: SyncOptions = {}): Promise<CLIHubRegistry> {
    const cachePath = join(this.cacheDir, 'cli-hub-registry.json');
    
    // Check cache
    if (!options.force && existsSync(cachePath)) {
      const cached = await this.loadCache(cachePath);
      const cacheAge = Date.now() - new Date(cached.meta.updated).getTime();
      
      // Cache valid for 1 hour
      if (cacheAge < 3600000) {
        this.cache = cached;
        return cached;
      }
    }
    
    // Fetch from remote
    try {
      const response = await fetch(CLI_HUB_REGISTRY_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.status}`);
      }
      
      const registry = await response.json() as CLIHubRegistry;
      this.cache = registry;
      
      // Save to cache
      await this.saveCache(cachePath, registry);
      
      return registry;
    } catch (error) {
      // Return cached version if available
      if (this.cache) {
        return this.cache;
      }
      
      // Return embedded fallback
      return this.getEmbeddedFallback();
    }
  }
  
  /**
   * 获取合并后的注册表
   */
  async getMergedRegistry(options: SyncOptions = {}): Promise<MergedRegistry> {
    const cliHub = await this.syncCLIHub(options);
    
    // Convert CLI-Hub entries to merged format
    const skills: MergedSkillEntry[] = cliHub.clis.map(entry => ({
      url: `skill://cli-anything/${entry.name}@${entry.version}`,
      name: entry.display_name,
      description: entry.description,
      version: entry.version,
      category: entry.category,
      source: 'cli-anything' as const,
      entryPoint: entry.entry_point,
      installCmd: entry.install_cmd,
      skillMdPath: entry.skill_md || undefined,
    }));
    
    // Build category counts
    const categories: Record<string, number> = {};
    for (const skill of skills) {
      categories[skill.category] = (categories[skill.category] || 0) + 1;
    }
    
    return {
      version: '1.0.0',
      updated: new Date().toISOString(),
      sources: {
        cli_anything: cliHub,
      },
      skills,
      categories,
    };
  }
  
  /**
   * 搜索技能
   */
  async search(query: string, options: SyncOptions = {}): Promise<MergedSkillEntry[]> {
    const registry = await this.getMergedRegistry(options);
    
    const lowerQuery = query.toLowerCase();
    
    return registry.skills.filter(skill =>
      skill.name.toLowerCase().includes(lowerQuery) ||
      skill.description.toLowerCase().includes(lowerQuery) ||
      skill.category.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * 按类别列出技能
   */
  async listByCategory(category: string, options: SyncOptions = {}): Promise<MergedSkillEntry[]> {
    const registry = await this.getMergedRegistry(options);
    
    return registry.skills.filter(skill =>
      skill.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  /**
   * 获取所有类别
   */
  async getCategories(options: SyncOptions = {}): Promise<Array<{ name: string; count: number }>> {
    const registry = await this.getMergedRegistry(options);
    
    return Object.entries(registry.categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * 获取技能详情
   */
  async getSkill(name: string, options: SyncOptions = {}): Promise<MergedSkillEntry | null> {
    const registry = await this.getMergedRegistry(options);
    
    return registry.skills.find(skill =>
      skill.name.toLowerCase() === name.toLowerCase() ||
      skill.url.includes(`/${name}@`) ||
      skill.url.includes(`/${name}`)
    ) || null;
  }
  
  // ==================== Private Methods ====================
  
  private async loadCache(path: string): Promise<CLIHubRegistry> {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  }
  
  private async saveCache(path: string, data: CLIHubRegistry): Promise<void> {
    if (!existsSync(this.cacheDir)) {
      await mkdir(this.cacheDir, { recursive: true });
    }
    
    await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
  }
  
  private getEmbeddedFallback(): CLIHubRegistry {
    return {
      meta: {
        repo: 'https://github.com/HKUDS/CLI-Anything',
        description: 'CLI-Hub — Agent-native stateful CLI interfaces',
        updated: new Date().toISOString(),
      },
      clis: [
        {
          name: 'blender',
          display_name: 'Blender',
          version: '1.0.0',
          description: '3D modeling, animation, and rendering',
          requires: 'blender',
          homepage: 'https://www.blender.org',
          install_cmd: 'pip install git+https://github.com/HKUDS/CLI-Anything.git#subdirectory=blender/agent-harness',
          entry_point: 'cli-anything-blender',
          skill_md: 'blender/agent-harness/cli_anything/blender/skills/SKILL.md',
          category: '3d',
        },
        {
          name: 'gimp',
          display_name: 'GIMP',
          version: '1.0.0',
          description: 'Image editing',
          requires: 'gimp, pillow',
          homepage: 'https://www.gimp.org',
          install_cmd: 'pip install git+https://github.com/HKUDS/CLI-Anything.git#subdirectory=gimp/agent-harness',
          entry_point: 'cli-anything-gimp',
          skill_md: 'gimp/agent-harness/cli_anything/gimp/skills/SKILL.md',
          category: 'image',
        },
        {
          name: 'libreoffice',
          display_name: 'LibreOffice',
          version: '1.0.0',
          description: 'Office suite (Writer, Calc, Impress)',
          requires: 'libreoffice',
          homepage: 'https://www.libreoffice.org',
          install_cmd: 'pip install git+https://github.com/HKUDS/CLI-Anything.git#subdirectory=libreoffice/agent-harness',
          entry_point: 'cli-anything-libreoffice',
          skill_md: 'libreoffice/agent-harness/cli_anything/libreoffice/skills/SKILL.md',
          category: 'office',
        },
        {
          name: 'ollama',
          display_name: 'Ollama',
          version: '1.0.0',
          description: 'Local LLM inference',
          requires: 'ollama server running',
          homepage: 'https://ollama.ai',
          install_cmd: 'pip install git+https://github.com/HKUDS/CLI-Anything.git#subdirectory=ollama/agent-harness',
          entry_point: 'cli-anything-ollama',
          skill_md: 'ollama/agent-harness/cli_anything/ollama/skills/SKILL.md',
          category: 'ai',
        },
      ],
    };
  }
}

// Export singleton instance
export const registrySync = new RegistrySync();