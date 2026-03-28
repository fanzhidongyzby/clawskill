/**
 * Session Manager - 会话状态管理
 * 
 * 管理 CLI-Anything 会话的状态持久化、undo/redo
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

/**
 * 会话状态
 */
export interface SessionState {
  /** 会话 ID */
  id: string;
  
  /** 技能 URL */
  skillUrl: string;
  
  /** 项目文件路径 */
  projectPath?: string;
  
  /** 修改状态 */
  modified: boolean;
  
  /** 命令历史 */
  history: HistoryEntry[];
  
  /** 当前状态索引（用于 undo/redo） */
  currentIndex: number;
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 更新时间 */
  updatedAt: Date;
  
  /** 自定义数据 */
  data?: Record<string, any>;
}

/**
 * 历史记录条目
 */
export interface HistoryEntry {
  /** 命令 */
  command: string;
  
  /** 参数 */
  args: Record<string, any>;
  
  /** 执行时间 */
  timestamp: Date;
  
  /** 执行结果摘要 */
  result?: string;
  
  /** 快照（用于 undo） */
  snapshot?: any;
}

/**
 * 会话管理器选项
 */
export interface SessionManagerOptions {
  /** 会话存储目录 */
  storageDir?: string;
  
  /** 最大历史记录数 */
  maxHistory?: number;
  
  /** 自动保存间隔（毫秒） */
  autoSaveInterval?: number;
}

/**
 * 会话管理器
 */
export class SessionManager {
  private sessions: Map<string, SessionState> = new Map();
  private storageDir: string;
  private maxHistory: number;
  
  constructor(options: SessionManagerOptions = {}) {
    this.storageDir = options.storageDir || join(process.cwd(), '.clawskill', 'sessions');
    this.maxHistory = options.maxHistory || 100;
  }
  
  /**
   * 创建新会话
   */
  async createSession(skillUrl: string, projectPath?: string): Promise<SessionState> {
    const id = this.generateSessionId();
    
    const session: SessionState = {
      id,
      skillUrl,
      projectPath,
      modified: false,
      history: [],
      currentIndex: -1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.sessions.set(id, session);
    
    // Save to disk
    await this.saveSession(id);
    
    return session;
  }
  
  /**
   * 获取会话
   */
  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * 获取活跃会话
   */
  getActiveSession(): SessionState | undefined {
    // Return the most recently updated session
    const sessions = Array.from(this.sessions.values());
    if (sessions.length === 0) return undefined;
    
    return sessions.reduce((latest, session) => 
      session.updatedAt > latest.updatedAt ? session : latest
    );
  }
  
  /**
   * 更新会话状态
   */
  async updateSession(sessionId: string, updates: Partial<SessionState>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    Object.assign(session, updates, { updatedAt: new Date() });
    await this.saveSession(sessionId);
  }
  
  /**
   * 记录命令执行
   */
  async recordCommand(
    sessionId: string,
    command: string,
    args: Record<string, any>,
    result?: string,
    snapshot?: any
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const entry: HistoryEntry = {
      command,
      args,
      timestamp: new Date(),
      result,
      snapshot,
    };
    
    // Add to history
    session.history.push(entry);
    
    // Trim history if needed
    if (session.history.length > this.maxHistory) {
      session.history = session.history.slice(-this.maxHistory);
    }
    
    // Update index
    session.currentIndex = session.history.length - 1;
    session.modified = true;
    session.updatedAt = new Date();
    
    await this.saveSession(sessionId);
  }
  
  /**
   * Undo - 撤销上一个命令
   */
  async undo(sessionId: string): Promise<HistoryEntry | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.currentIndex < 0) {
      return null;
    }
    
    const entry = session.history[session.currentIndex];
    session.currentIndex--;
    session.updatedAt = new Date();
    
    await this.saveSession(sessionId);
    
    return entry;
  }
  
  /**
   * Redo - 重做下一个命令
   */
  async redo(sessionId: string): Promise<HistoryEntry | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.currentIndex >= session.history.length - 1) {
      return null;
    }
    
    session.currentIndex++;
    const entry = session.history[session.currentIndex];
    session.updatedAt = new Date();
    
    await this.saveSession(sessionId);
    
    return entry;
  }
  
  /**
   * 获取历史记录
   */
  getHistory(sessionId: string): HistoryEntry[] {
    const session = this.sessions.get(sessionId);
    return session?.history || [];
  }
  
  /**
   * 保存会话到磁盘
   */
  async saveSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const sessionPath = join(this.storageDir, `${sessionId}.json`);
    
    // Ensure directory exists
    if (!existsSync(this.storageDir)) {
      await mkdir(this.storageDir, { recursive: true });
    }
    
    await writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
  }
  
  /**
   * 从磁盘加载会话
   */
  async loadSession(sessionId: string): Promise<SessionState | null> {
    const sessionPath = join(this.storageDir, `${sessionId}.json`);
    
    if (!existsSync(sessionPath)) {
      return null;
    }
    
    try {
      const content = await readFile(sessionPath, 'utf-8');
      const session = JSON.parse(content) as SessionState;
      
      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);
      session.history.forEach(entry => {
        entry.timestamp = new Date(entry.timestamp);
      });
      
      this.sessions.set(sessionId, session);
      return session;
    } catch {
      return null;
    }
  }
  
  /**
   * 列出所有会话
   */
  async listSessions(): Promise<SessionState[]> {
    if (!existsSync(this.storageDir)) {
      return [];
    }
    
    const { readdir } = await import('fs/promises');
    const files = await readdir(this.storageDir);
    
    const sessions: SessionState[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const sessionId = file.replace('.json', '');
        const session = await this.loadSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }
    }
    
    return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  /**
   * 关闭会话
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // Save final state
    await this.saveSession(sessionId);
    
    // Remove from memory
    this.sessions.delete(sessionId);
  }
  
  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    const { unlink } = await import('fs/promises');
    
    this.sessions.delete(sessionId);
    
    const sessionPath = join(this.storageDir, `${sessionId}.json`);
    if (existsSync(sessionPath)) {
      await unlink(sessionPath);
    }
  }
  
  // ==================== Private Methods ====================
  
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();