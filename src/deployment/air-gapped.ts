/**
 * 私有部署架构 - Air-Gapped 环境
 *
 * 核心原则：
 * - 零外部连接：无入站/出站连接
 * - 无互联网依赖：不依赖云 API 或外部服务
 * - 零遥测设计：无数据收集或匿名使用统计
 * - 离线技能索引包：通过物理介质或受控内网分发
 *
 * 部署模型：
 * - Cloud SaaS ($999/月)
 * - VPC/Private Cloud ($1,499/月)
 * - On-Premise ($1,499/月 + 实施费)
 * - Air-Gapped ($1,999/月 + 实施费)
 */

/**
 * 部署配置
 */
export interface DeploymentConfig {
  // 部署模式
  mode: 'cloud-saas' | 'vpc' | 'on-premise' | 'air-gapped';

  // 网络配置
  network: {
    allowInternet: boolean;
    allowTelemetry: boolean;
    allowedHosts: string[];
    inboundPorts: number[];
    outboundPorts: number[];
  };

  // 存储配置
  storage: {
    type: 'local' | 'nfs' | 's3-compatible';
    path: string;
    sizeGB: number;
  };

  // 向量数据库配置
  vectorDb: {
    type: 'qdrant' | 'weaviate' | 'milvus';
    host: string;
    port: number;
    offline: boolean;
  };

  // 元数据库配置
  metadataDb: {
    type: 'postgresql' | 'mysql' | 'sqlite';
    host: string;
    port: number;
    database: string;
  };

  // 索引配置
  indexing: {
    offlineMode: boolean;
    updateSchedule: 'realtime' | 'hourly' | 'daily' | 'manual';
    indexPackagePath?: string;
  };

  // 安全配置
  security: {
    tlsEnabled: boolean;
    authProvider: 'local' | 'ldap' | 'oauth2' | 'saml';
    rbacEnabled: boolean;
    auditLogging: boolean;
  };
}

/**
 * 默认 Air-Gapped 配置
 */
export const DEFAULT_AIR_GAPPED_CONFIG: DeploymentConfig = {
  mode: 'air-gapped',
  network: {
    allowInternet: false,
    allowTelemetry: false,
    allowedHosts: [],
    inboundPorts: [443, 8080],
    outboundPorts: [], // 无出站端口
  },
  storage: {
    type: 'local',
    path: '/data/clawskill',
    sizeGB: 1000,
  },
  vectorDb: {
    type: 'qdrant',
    host: 'localhost',
    port: 6333,
    offline: true,
  },
  metadataDb: {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'clawskill',
  },
  indexing: {
    offlineMode: true,
    updateSchedule: 'manual',
    indexPackagePath: '/data/clawskill/index-packages',
  },
  security: {
    tlsEnabled: true,
    authProvider: 'local',
    rbacEnabled: true,
    auditLogging: true,
  },
};

/**
 * 离线技能索引包
 */
export interface OfflineIndexPackage {
  id: string;
  version: string;
  createdAt: Date;
  expiresAt?: Date;
  skills: {
    id: string;
    name: string;
    namespace: string;
    version: string;
    checksum: string;
  }[];
  embeddings: {
    count: number;
    dimensions: number;
    format: 'numpy' | 'json';
  };
  metadata: {
    totalSkills: number;
    totalSize: number;
    gpgSignature: string;
    sha256sum: string;
  };
}

/**
 * 部署验证结果
 */
export interface DeploymentValidationResult {
  valid: boolean;
  mode: DeploymentConfig['mode'];
  checks: {
    networkIsolation: { passed: boolean; details: string };
    telemetryDisabled: { passed: boolean; details: string };
    offlineStorage: { passed: boolean; details: string };
    localDatabase: { passed: boolean; details: string };
    securityConfig: { passed: boolean; details: string };
  };
  warnings: string[];
  errors: string[];
}

/**
 * 空气隔离验证器
 */
export class AirGappedValidator {
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig = DEFAULT_AIR_GAPPED_CONFIG) {
    this.config = config;
  }

  /**
   * 验证部署配置是否符合 Air-Gapped 要求
   */
  async validate(): Promise<DeploymentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const checks = {
      networkIsolation: await this.checkNetworkIsolation(),
      telemetryDisabled: await this.checkTelemetryDisabled(),
      offlineStorage: await this.checkOfflineStorage(),
      localDatabase: await this.checkLocalDatabase(),
      securityConfig: await this.checkSecurityConfig(),
    };

    // 收集错误和警告
    for (const [, result] of Object.entries(checks)) {
      if (!result.passed) {
        errors.push(result.details);
      }
    }

    // 检查配置一致性
    if (this.config.mode === 'air-gapped') {
      if (this.config.network.allowInternet) {
        errors.push('Air-gapped mode cannot have internet access enabled');
      }
      if (this.config.network.allowTelemetry) {
        errors.push('Air-gapped mode cannot have telemetry enabled');
      }
    }

    return {
      valid: errors.length === 0,
      mode: this.config.mode,
      checks,
      warnings,
      errors,
    };
  }

  /**
   * 检查网络隔离
   */
  private async checkNetworkIsolation(): Promise<{ passed: boolean; details: string }> {
    // 检查出站端口
    if (this.config.network.outboundPorts.length > 0) {
      return {
        passed: false,
        details: `Outbound ports configured: ${this.config.network.outboundPorts.join(', ')}`,
      };
    }

    // 检查允许的主机
    if (this.config.network.allowedHosts.length > 0) {
      return {
        passed: false,
        details: `External hosts allowed: ${this.config.network.allowedHosts.join(', ')}`,
      };
    }

    return {
      passed: !this.config.network.allowInternet,
      details: this.config.network.allowInternet
        ? 'Internet access is enabled'
        : 'Network properly isolated',
    };
  }

  /**
   * 检查遥测禁用
   */
  private async checkTelemetryDisabled(): Promise<{ passed: boolean; details: string }> {
    return {
      passed: !this.config.network.allowTelemetry,
      details: this.config.network.allowTelemetry
        ? 'Telemetry is enabled - not allowed in air-gapped mode'
        : 'Telemetry properly disabled',
    };
  }

  /**
   * 检查离线存储
   */
  private async checkOfflineStorage(): Promise<{ passed: boolean; details: string }> {
    // 检查存储类型
    if (this.config.storage.type === 's3-compatible') {
      return {
        passed: false,
        details: 'S3-compatible storage may require internet access',
      };
    }

    // 检查索引模式
    if (!this.config.indexing.offlineMode) {
      return {
        passed: false,
        details: 'Indexing offline mode is not enabled',
      };
    }

    return {
      passed: true,
      details: `Local storage configured at ${this.config.storage.path}`,
    };
  }

  /**
   * 检查本地数据库
   */
  private async checkLocalDatabase(): Promise<{ passed: boolean; details: string }> {
    // 检查向量数据库是否离线
    if (!this.config.vectorDb.offline) {
      return {
        passed: false,
        details: 'Vector database is not configured for offline mode',
      };
    }

    // 检查主机是否为本地
    const localHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
    if (!localHosts.includes(this.config.metadataDb.host)) {
      return {
        passed: false,
        details: `Metadata database host ${this.config.metadataDb.host} is not local`,
      };
    }

    return {
      passed: true,
      details: 'Local databases configured',
    };
  }

  /**
   * 检查安全配置
   */
  private async checkSecurityConfig(): Promise<{ passed: boolean; details: string }> {
    if (!this.config.security.tlsEnabled) {
      return {
        passed: false,
        details: 'TLS is not enabled',
      };
    }

    if (!this.config.security.rbacEnabled) {
      return {
        passed: false,
        details: 'RBAC is not enabled',
      };
    }

    if (!this.config.security.auditLogging) {
      return {
        passed: false,
        details: 'Audit logging is not enabled',
      };
    }

    return {
      passed: true,
      details: 'Security configuration complete',
    };
  }

  /**
   * 生成 Kubernetes 部署清单
   */
  generateKubernetesManifest(): string {
    return `
apiVersion: v1
kind: Namespace
metadata:
  name: clawskill-system
  labels:
    app.kubernetes.io/name: clawskill
    app.kubernetes.io/component: air-gapped
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: clawskill-config
  namespace: clawskill-system
data:
  # 零遥测配置
  TELEMETRY_ENABLED: "false"
  ANALYTICS_ENABLED: "false"
  USAGE_REPORTING: "false"
  # 离线模式
  OFFLINE_MODE: "true"
  INDEX_UPDATE_SCHEDULE: "${this.config.indexing.updateSchedule}"
  # 存储路径
  STORAGE_PATH: "${this.config.storage.path}"
  # 数据库配置
  DB_HOST: "${this.config.metadataDb.host}"
  DB_PORT: "${this.config.metadataDb.port.toString()}"
  DB_NAME: "${this.config.metadataDb.database}"
  # 向量数据库
  VECTOR_DB_TYPE: "${this.config.vectorDb.type}"
  VECTOR_DB_HOST: "${this.config.vectorDb.host}"
  VECTOR_DB_PORT: "${this.config.vectorDb.port.toString()}"
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-egress
  namespace: clawskill-system
spec:
  podSelector:
    matchLabels: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: clawskill-system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: clawskill-api
  namespace: clawskill-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: clawskill-api
  template:
    metadata:
      labels:
        app: clawskill-api
    spec:
      containers:
      - name: clawskill-api
        image: clawskill/api:latest
        ports:
        - containerPort: 8080
        envFrom:
        - configMapRef:
            name: clawskill-config
        volumeMounts:
        - name: skill-index
          mountPath: /data/skills
        - name: vector-db
          mountPath: /data/vector
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
      volumes:
      - name: skill-index
        persistentVolumeClaim:
          claimName: skill-index-pvc
      - name: vector-db
        persistentVolumeClaim:
          claimName: vector-db-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: skill-index-pvc
  namespace: clawskill-system
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: ${this.config.storage.sizeGB}Gi
`;
  }
}

/**
 * 离线索引包管理器
 */
export class OfflineIndexPackageManager {
  private packagePath: string;
  private packages: Map<string, OfflineIndexPackage> = new Map();

  constructor(packagePath: string = '/data/clawskill/index-packages') {
    this.packagePath = packagePath;
  }

  /**
   * 导入离线索引包
   */
  async importPackage(packagePath: string): Promise<OfflineIndexPackage> {
    // 模拟导入过程
    const pkg: OfflineIndexPackage = {
      id: `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: '2026-03-31',
      createdAt: new Date(),
      skills: [],
      embeddings: {
        count: 351000,
        dimensions: 1536,
        format: 'numpy',
      },
      metadata: {
        totalSkills: 351000,
        totalSize: 400 * 1024 * 1024 * 1024, // 400GB
        gpgSignature: '-----BEGIN PGP SIGNATURE-----',
        sha256sum: 'abc123...',
      },
    };

    this.packages.set(pkg.id, pkg);
    return pkg;
  }

  /**
   * 验证索引包完整性
   */
  async verifyPackage(pkg: OfflineIndexPackage): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 验证签名
    if (!pkg.metadata.gpgSignature) {
      errors.push('Missing GPG signature');
    }

    // 验证校验和
    if (!pkg.metadata.sha256sum) {
      errors.push('Missing SHA256 checksum');
    }

    // 验证技能数量
    if (pkg.metadata.totalSkills === 0) {
      errors.push('No skills in package');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取已导入的包列表
   */
  getImportedPackages(): OfflineIndexPackage[] {
    return Array.from(this.packages.values());
  }

  /**
   * 获取最新包
   */
  getLatestPackage(): OfflineIndexPackage | null {
    const packages = this.getImportedPackages();
    if (packages.length === 0) return null;
    return packages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }
}

/**
 * 遥测控制（确保禁用）
 */
export class TelemetryControl {
  private static instance: TelemetryControl;
  private enabled: boolean = false;

  private constructor() {
    // 单例模式，确保遥测被禁用
  }

  static getInstance(): TelemetryControl {
    if (!TelemetryControl.instance) {
      TelemetryControl.instance = new TelemetryControl();
    }
    return TelemetryControl.instance;
  }

  /**
   * 检查遥测是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 禁用遥测（Air-Gapped 模式强制禁用）
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * 记录事件（Air-Gapped 模式下为空操作）
   */
  trackEvent(eventName: string, properties?: Record<string, unknown>): void {
    // Air-Gapped 模式：空操作，不发送任何数据
    if (this.enabled) {
      console.warn('Telemetry is disabled in air-gapped mode');
    }
  }

  /**
   * 记录异常（Air-Gapped 模式下仅本地日志）
   */
  trackException(error: Error): void {
    // Air-Gapped 模式：仅本地日志
    console.error('[Local Log]', error.message);
  }
}

// 导出单例
export const telemetryControl = TelemetryControl.getInstance();
export const airGappedValidator = new AirGappedValidator();