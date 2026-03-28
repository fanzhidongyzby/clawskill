/**
 * CLI-Anything Source - 技能源适配器
 * 
 * 从 CLI-Hub registry 索引和安装 CLI-Anything 生成的技能
 * 
 * @see https://github.com/HKUDS/CLI-Anything
 */

import { SkillSource, Skill, SkillSearchResult, InstallResult } from '../types/skill';
import { parseSkillUrl, formatSkillUrl } from '../core/skill-url';

const CLI_HUB_REGISTRY_URL = 'https://hkuds.github.io/CLI-Anything/registry.json';
const CLI_ANYTHING_REPO = 'https://github.com/HKUDS/CLI-Anything';

/**
 * CLI-Hub Registry 结构
 */
interface CLIHubRegistry {
  meta: {
    repo: string;
    description: string;
    updated: string;
  };
  clis: CLIHubEntry[];
}

interface CLIHubEntry {
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
 * CLI-Anything 技能源适配器
 */
export class CLIAnythingSource implements SkillSource {
  name = 'cli-anything';
  displayName = 'CLI-Anything';
  description = 'Agent-native CLI interfaces for professional software';
  
  private registry: CLIHubRegistry | null = null;
  private registryCacheTime: number = 0;
  private cacheTTL = 3600000; // 1 hour cache
  
  /**
   * 从 CLI-Hub 搜索技能
   */
  async search(query: string): Promise<SkillSearchResult[]> {
    const registry = await this.getRegistry();
    const entries = this.filterByQuery(registry.clis, query);
    
    return entries.map(entry => this.entryToSearchResult(entry));
  }
  
  /**
   * 获取技能详情
   */
  async getSkill(skillUrl: string): Promise<Skill> {
    const { namespace, name, version } = parseSkillUrl(skillUrl);
    
    if (namespace !== 'cli-anything') {
      throw new Error(`Invalid namespace for CLI-Anything source: ${namespace}`);
    }
    
    const entry = await this.getRegistryEntry(name);
    
    return this.entryToSkill(entry, version || entry.version);
  }
  
  /**
   * 安装技能 CLI
   */
  async install(skillUrl: string): Promise<InstallResult> {
    const skill = await this.getSkill(skillUrl);
    
    // Check if already installed
    const entryPoint = skill.entryPoint || `cli-anything-${skill.name.toLowerCase()}`;
    const isInstalled = await this.checkInstalled(entryPoint);
    if (isInstalled) {
      return {
        success: true,
        message: `CLI ${entryPoint} is already installed`,
        path: entryPoint,
      };
    }
    
    // Run pip install
    try {
      await this.runPipInstall(skill.installCmd || '');
      return {
        success: true,
        message: `Successfully installed ${skill.name}`,
        path: entryPoint,
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      return {
        success: false,
        message: `Failed to install: ${errMsg}`,
        error: errMsg,
      };
    }
  }
  
  /**
   * 获取技能元数据
   */
  async getSkillMetadata(skillUrl: string): Promise<Record<string, any>> {
    const skill = await this.getSkill(skillUrl);
    
    return {
      name: skill.name,
      entryPoint: skill.entryPoint,
      category: skill.category,
      requires: skill.requires,
      homepage: skill.homepage,
      installCmd: skill.installCmd,
    };
  }
  
  /**
   * 列出所有 CLI-Anything 技能
   */
  async listAll(): Promise<SkillSearchResult[]> {
    const registry = await this.getRegistry();
    return registry.clis.map(entry => this.entryToSearchResult(entry));
  }
  
  /**
   * 按类别列出技能
   */
  async listByCategory(category: string): Promise<SkillSearchResult[]> {
    const registry = await this.getRegistry();
    return registry.clis
      .filter(entry => entry.category === category)
      .map(entry => this.entryToSearchResult(entry));
  }
  
  /**
   * 获取所有类别
   */
  async getCategories(): Promise<string[]> {
    const registry = await this.getRegistry();
    const categories = new Set(registry.clis.map(entry => entry.category));
    return Array.from(categories);
  }
  
  // ==================== Private Methods ====================
  
  private async getRegistry(): Promise<CLIHubRegistry> {
    // Check cache
    if (this.registry && Date.now() - this.registryCacheTime < this.cacheTTL) {
      return this.registry;
    }
    
    // Fetch from CLI-Hub
    try {
      const response = await fetch(CLI_HUB_REGISTRY_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.status}`);
      }
      
      this.registry = await response.json() as CLIHubRegistry;
      this.registryCacheTime = Date.now();
      return this.registry!;
    } catch (error) {
      // Fallback to embedded registry
      console.warn('Failed to fetch CLI-Hub registry, using embedded fallback');
      return this.getEmbeddedRegistry();
    }
  }
  
  private async getRegistryEntry(name: string): Promise<CLIHubEntry> {
    const registry = await this.getRegistry();
    const entry = registry.clis.find(e => e.name === name);
    
    if (!entry) {
      throw new Error(`CLI-Anything skill '${name}' not found in registry`);
    }
    
    return entry;
  }
  
  private filterByQuery(entries: CLIHubEntry[], query: string): CLIHubEntry[] {
    const lowerQuery = query.toLowerCase();
    
    return entries.filter(entry => 
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.display_name.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery) ||
      entry.category.toLowerCase().includes(lowerQuery)
    );
  }
  
  private entryToSearchResult(entry: CLIHubEntry): SkillSearchResult {
    return {
      url: formatSkillUrl({ namespace: 'cli-anything', name: entry.name, version: entry.version }),
      name: entry.display_name,
      description: entry.description,
      version: entry.version,
      category: entry.category,
      source: this.name,
    };
  }
  
  private entryToSkill(entry: CLIHubEntry, version: string): Skill {
    return {
      id: `cli-anything/${entry.name}`,
      name: entry.display_name,
      description: entry.description,
      version: version,
      author: entry.contributor || 'CLI-Anything',
      license: 'MIT',
      keywords: [],
      categories: [entry.category],
      downloads: 0,
      stars: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      namespace: 'cli-anything',
      source: this.name,
      
      // CLI-Anything specific fields
      category: entry.category,
      installCmd: entry.install_cmd,
      entryPoint: entry.entry_point,
      skillMdPath: entry.skill_md ?? undefined,
      requires: entry.requires,
      homepage: entry.homepage,
    };
  }
  
  private async checkInstalled(entryPoint: string): Promise<boolean> {
    try {
      // Use 'which' to check if CLI is in PATH
      const { execSync } = require('child_process');
      execSync(`which ${entryPoint}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  private async runPipInstall(installCmd: string): Promise<void> {
    const { execSync } = require('child_process');
    execSync(installCmd, { 
      stdio: 'inherit',
      timeout: 120000, // 2 minutes timeout
    });
  }
  
  /**
   * Embedded fallback registry (subset of popular CLIs)
   */
  private getEmbeddedRegistry(): CLIHubRegistry {
    return {
      meta: {
        repo: CLI_ANYTHING_REPO,
        description: 'CLI-Hub — Agent-native stateful CLI interfaces',
        updated: '2026-03-28',
      },
      clis: [
        {
          name: 'blender',
          display_name: 'Blender',
          version: '1.0.0',
          description: '3D modeling, animation, and rendering via blender --background --python',
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
          description: 'Image editing via Pillow + GEGL/Script-Fu',
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
          description: 'Office suite (Writer, Calc, Impress) via ODF + headless LibreOffice',
          requires: 'libreoffice',
          homepage: 'https://www.libreoffice.org',
          install_cmd: 'pip install git+https://github.com/HKUDS/CLI-Anything.git#subdirectory=libreoffice/agent-harness',
          entry_point: 'cli-anything-libreoffice',
          skill_md: 'libreoffice/agent-harness/cli_anything/libreoffice/skills/SKILL.md',
          category: 'office',
        },
        {
          name: 'shotcut',
          display_name: 'Shotcut',
          version: '1.0.0',
          description: 'Video editing via MLT XML + melt renderer',
          requires: 'shotcut, melt',
          homepage: 'https://shotcut.org',
          install_cmd: 'pip install git+https://github.com/HKUDS/CLI-Anything.git#subdirectory=shotcut/agent-harness',
          entry_point: 'cli-anything-shotcut',
          skill_md: 'shotcut/agent-harness/cli_anything/shotcut/skills/SKILL.md',
          category: 'video',
        },
        {
          name: 'ollama',
          display_name: 'Ollama',
          version: '1.0.0',
          description: 'Local LLM inference via Ollama REST API',
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
export const cliAnythingSource = new CLIAnythingSource();