/**
 * Credits Calculator - 变现系统核心计算器
 *
 * 基于实际 LLM 调用计算 Credits 消耗
 * 支持 Usage-Based 定价
 *
 * Credits 计算公式：
 * Credits = BaseCost × MessageTypeWeight / ExchangeRate
 *
 * BaseCost = (PromptTokens + CompletionTokens × 3) × PricePer1kTokens / 1000
 * ExchangeRate = $0.50 per Credit
 */

/**
 * 消息类型权重配置
 */
export interface MessageTypeWeights {
  collaboration: number;   // 协作类消息（默认 1.0）
  exploration: number;     // 探索类消息（默认 0.5）
  insight: number;         // 洞察类消息（默认 1.0）
  result: number;          // 结果类消息（默认 1.0）
  read_discovery: number;  // 读取发现（默认 1.0）
  tool_call: number;       // 工具调用（默认 0.8）
  reasoning: number;       // 推理（默认 1.2）
}

const DEFAULT_MESSAGE_TYPE_WEIGHTS: MessageTypeWeights = {
  collaboration: 1.0,
  exploration: 0.5,
  insight: 1.0,
  result: 1.0,
  read_discovery: 1.0,
  tool_call: 0.8,
  reasoning: 1.2,
};

/**
 * LLM 定价配置（每 1K tokens）
 */
export interface LLMPriceConfig {
  provider: string;
  model: string;
  promptPrice: number;     // 输入 tokens 价格 ($/1K)
  completionPrice: number; // 输出 tokens 价格 ($/1K)
}

const DEFAULT_LLM_PRICES: Record<string, LLMPriceConfig> = {
  'gpt-4o': { provider: 'openai', model: 'gpt-4o', promptPrice: 0.0025, completionPrice: 0.01 },
  'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini', promptPrice: 0.00015, completionPrice: 0.0006 },
  'gpt-4-turbo': { provider: 'openai', model: 'gpt-4-turbo', promptPrice: 0.01, completionPrice: 0.03 },
  'claude-3.5-sonnet': { provider: 'anthropic', model: 'claude-3.5-sonnet', promptPrice: 0.003, completionPrice: 0.015 },
  'claude-3-opus': { provider: 'anthropic', model: 'claude-3-opus', promptPrice: 0.015, completionPrice: 0.075 },
  'gemini-1.5-pro': { provider: 'google', model: 'gemini-1.5-pro', promptPrice: 0.00125, completionPrice: 0.005 },
  'default': { provider: 'unknown', model: 'default', promptPrice: 0.002, completionPrice: 0.006 },
};

/**
 * Credits 计算结果
 */
export interface CreditResult {
  credits: number;           // Credits 数量
  cost: number;              // 实际成本 ($)
  promptTokens: number;      // 输入 tokens
  completionTokens: number;  // 输出 tokens
  totalTokens: number;       // 总 tokens
  messageType: string;       // 消息类型
  model: string;             // 使用的模型
  weightApplied: number;     // 应用权重
}

/**
 * Credits 使用记录
 */
export interface CreditUsageRecord {
  id: string;
  userId: string;
  skillId: string;
  sessionId: string;
  credits: number;
  cost: number;
  messageType: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Credits 账户摘要
 */
export interface CreditAccountSummary {
  userId: string;
  totalCreditsUsed: number;
  totalCost: number;
  creditsBalance: number;          // 剩余 Credits（预付费模式）
  subscriptionTier?: string;       // 订阅等级
  usageBySkill: Map<string, number>;
  usageByMessageType: Map<string, number>;
  lastActivity: Date;
}

/**
 * Credits 配置
 */
export interface CreditsConfig {
  exchangeRate: number;            // $ per Credit (默认 $0.50)
  completionMultiplier: number;    // 输出 tokens 权重倍数（默认 3）
  messageTypeWeights: MessageTypeWeights;
  llmPrices: Record<string, LLMPriceConfig>;
  freeCreditsPerMonth: number;     // 每月免费 Credits
  subscriptionTiers: SubscriptionTier[];
}

/**
 * 订阅等级
 */
export interface SubscriptionTier {
  name: string;
  monthlyPrice: number;            // 月费 ($)
  includedCredits: number;         // 包含 Credits
  additionalCreditsPrice: number;  // 额外 Credits 价格 ($/Credit)
  features: string[];
}

const DEFAULT_SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    name: 'free',
    monthlyPrice: 0,
    includedCredits: 100,
    additionalCreditsPrice: 0.50,
    features: ['Basic skill search', 'Limited quality scores'],
  },
  {
    name: 'pro',
    monthlyPrice: 29,
    includedCredits: 1000,
    additionalCreditsPrice: 0.40,
    features: ['Full skill search', 'Quality scores', 'Priority indexing'],
  },
  {
    name: 'enterprise',
    monthlyPrice: 299,
    includedCredits: 10000,
    additionalCreditsPrice: 0.30,
    features: ['All features', 'Private skills', 'Custom models', 'SLA'],
  },
];

const DEFAULT_CONFIG: CreditsConfig = {
  exchangeRate: 0.50,
  completionMultiplier: 3,
  messageTypeWeights: DEFAULT_MESSAGE_TYPE_WEIGHTS,
  llmPrices: DEFAULT_LLM_PRICES,
  freeCreditsPerMonth: 100,
  subscriptionTiers: DEFAULT_SUBSCRIPTION_TIERS,
};

/**
 * Credits Calculator 服务
 */
export class CreditsCalculator {
  private config: CreditsConfig;
  private usageRecords: CreditUsageRecord[] = [];

  constructor(config: Partial<CreditsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 计算 Credits
   */
  calculate(
    messageType: string,
    promptTokens: number,
    completionTokens: number,
    model: string = 'default'
  ): CreditResult {
    // 获取模型定价
    const priceConfig = this.config.llmPrices[model] || this.config.llmPrices['default'];

    // 计算基础成本
    // 输出 tokens 权重更高（通常是输入的 3 倍）
    const effectiveCompletionTokens = completionTokens * this.config.completionMultiplier;
    const baseCost = 
      (promptTokens * priceConfig.promptPrice + effectiveCompletionTokens * priceConfig.completionPrice) / 1000;

    // 获取消息类型权重
    const weight = this.getMessageTypeWeight(messageType);

    // 计算 Credits
    const credits = baseCost * weight / this.config.exchangeRate;

    return {
      credits,
      cost: baseCost,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      messageType,
      model,
      weightApplied: weight,
    };
  }

  /**
   * 记录使用
   */
  recordUsage(
    userId: string,
    skillId: string,
    sessionId: string,
    result: CreditResult,
    metadata?: Record<string, unknown>
  ): CreditUsageRecord {
    const record: CreditUsageRecord = {
      id: this.generateId(),
      userId,
      skillId,
      sessionId,
      credits: result.credits,
      cost: result.cost,
      messageType: result.messageType,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      timestamp: new Date(),
      metadata,
    };

    this.usageRecords.push(record);
    return record;
  }

  /**
   * 获取用户账户摘要
   */
  getAccountSummary(userId: string): CreditAccountSummary {
    const userRecords = this.usageRecords.filter(r => r.userId === userId);

    const totalCreditsUsed = userRecords.reduce((sum, r) => sum + r.credits, 0);
    const totalCost = userRecords.reduce((sum, r) => sum + r.cost, 0);

    const usageBySkill = new Map<string, number>();
    const usageByMessageType = new Map<string, number>();

    for (const record of userRecords) {
      usageBySkill.set(
        record.skillId,
        (usageBySkill.get(record.skillId) || 0) + record.credits
      );
      usageByMessageType.set(
        record.messageType,
        (usageByMessageType.get(record.messageType) || 0) + record.credits
      );
    }

    return {
      userId,
      totalCreditsUsed,
      totalCost,
      creditsBalance: 0, // 需要从账户系统获取
      usageBySkill,
      usageByMessageType,
      lastActivity: userRecords.length > 0 
        ? userRecords[userRecords.length - 1].timestamp 
        : new Date(),
    };
  }

  /**
   * 获取技能使用统计
   */
  getSkillUsageStats(skillId: string): {
    totalCredits: number;
    totalCost: number;
    totalCalls: number;
    avgCreditsPerCall: number;
    usageByMessageType: Map<string, number>;
  } {
    const skillRecords = this.usageRecords.filter(r => r.skillId === skillId);

    const totalCredits = skillRecords.reduce((sum, r) => sum + r.credits, 0);
    const totalCost = skillRecords.reduce((sum, r) => sum + r.cost, 0);
    const totalCalls = skillRecords.length;
    const avgCreditsPerCall = totalCalls > 0 ? totalCredits / totalCalls : 0;

    const usageByMessageType = new Map<string, number>();
    for (const record of skillRecords) {
      usageByMessageType.set(
        record.messageType,
        (usageByMessageType.get(record.messageType) || 0) + record.credits
      );
    }

    return {
      totalCredits,
      totalCost,
      totalCalls,
      avgCreditsPerCall,
      usageByMessageType,
    };
  }

  /**
   * 获取历史流水
   */
  getHistory(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      skillId?: string;
      limit?: number;
    } = {}
  ): CreditUsageRecord[] {
    let records = this.usageRecords.filter(r => r.userId === userId);

    if (options.startDate) {
      records = records.filter(r => r.timestamp >= options.startDate);
    }
    if (options.endDate) {
      records = records.filter(r => r.timestamp <= options.endDate);
    }
    if (options.skillId) {
      records = records.filter(r => r.skillId === options.skillId);
    }

    // 按时间降序排序
    records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options.limit) {
      records = records.slice(0, options.limit);
    }

    return records;
  }

  /**
   * 获取订阅等级
   */
  getSubscriptionTier(name: string): SubscriptionTier | null {
    return this.config.subscriptionTiers.find(t => t.name === name) || null;
  }

  /**
   * 获取所有订阅等级
   */
  getSubscriptionTiers(): SubscriptionTier[] {
    return this.config.subscriptionTiers;
  }

  /**
   * 估算 Credits 消耗
   */
  estimateCredits(
    messageType: string,
    estimatedPromptTokens: number,
    estimatedCompletionTokens: number,
    model: string = 'default'
  ): CreditResult {
    return this.calculate(
      messageType,
      estimatedPromptTokens,
      estimatedCompletionTokens,
      model
    );
  }

  /**
   * 清除记录（测试用）
   */
  clearRecords(userId?: string): void {
    if (userId) {
      this.usageRecords = this.usageRecords.filter(r => r.userId !== userId);
    } else {
      this.usageRecords = [];
    }
  }

  /**
   * 获取消息类型权重
   */
  private getMessageTypeWeight(messageType: string): number {
    const weights = this.config.messageTypeWeights;
    const key = messageType as keyof MessageTypeWeights;
    return weights[key] || 1.0;
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `credit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * LLM 调用拦截器
 * 用于自动计算和记录 Credits
 */
export class LLMInterceptor {
  private calculator: CreditsCalculator;
  private userId: string;
  private sessionId: string;
  private skillId: string;

  constructor(
    calculator: CreditsCalculator,
    userId: string,
    sessionId: string,
    skillId: string
  ) {
    this.calculator = calculator;
    this.userId = userId;
    this.sessionId = sessionId;
    this.skillId = skillId;
  }

  /**
   * 包装 LLM 调用
   */
  async wrapLLMCall<T>(
    messageType: string,
    model: string,
    llmCall: () => Promise<{ result: T; usage: { promptTokens: number; completionTokens: number } }>
  ): Promise<{ result: T; creditResult: CreditResult; record: CreditUsageRecord }> {
    // 执行 LLM 调用
    const { result, usage } = await llmCall();

    // 计算 Credits
    const creditResult = this.calculator.calculate(
      messageType,
      usage.promptTokens,
      usage.completionTokens,
      model
    );

    // 记录使用
    const record = this.calculator.recordUsage(
      this.userId,
      this.skillId,
      this.sessionId,
      creditResult
    );

    return { result, creditResult, record };
  }

  /**
   * 预估调用成本
   */
  preEstimate(
    messageType: string,
    estimatedPromptTokens: number,
    estimatedCompletionTokens: number,
    model: string
  ): CreditResult {
    return this.calculator.estimateCredits(
      messageType,
      estimatedPromptTokens,
      estimatedCompletionTokens,
      model
    );
  }
}

// 导出单例
export const creditsCalculator = new CreditsCalculator();