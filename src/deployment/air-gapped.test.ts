/**
 * 私有部署架构单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AirGappedValidator,
  OfflineIndexPackageManager,
  TelemetryControl,
  DeploymentConfig,
  DEFAULT_AIR_GAPPED_CONFIG,
} from './air-gapped';

describe('AirGappedValidator', () => {
  let validator: AirGappedValidator;

  beforeEach(() => {
    validator = new AirGappedValidator(DEFAULT_AIR_GAPPED_CONFIG);
  });

  describe('validate', () => {
    it('should validate correct air-gapped config', async () => {
      const result = await validator.validate();

      expect(result.valid).toBe(true);
      expect(result.mode).toBe('air-gapped');
      expect(result.errors.length).toBe(0);
    });

    it('should detect internet access violation', async () => {
      const invalidConfig: DeploymentConfig = {
        ...DEFAULT_AIR_GAPPED_CONFIG,
        network: {
          ...DEFAULT_AIR_GAPPED_CONFIG.network,
          allowInternet: true,
        },
      };

      const invalidValidator = new AirGappedValidator(invalidConfig);
      const result = await invalidValidator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('internet'))).toBe(true);
    });

    it('should detect telemetry violation', async () => {
      const invalidConfig: DeploymentConfig = {
        ...DEFAULT_AIR_GAPPED_CONFIG,
        network: {
          ...DEFAULT_AIR_GAPPED_CONFIG.network,
          allowTelemetry: true,
        },
      };

      const invalidValidator = new AirGappedValidator(invalidConfig);
      const result = await invalidValidator.validate();

      expect(result.errors.some(e => e.includes('Telemetry'))).toBe(true);
    });

    it('should detect outbound ports violation', async () => {
      const invalidConfig: DeploymentConfig = {
        ...DEFAULT_AIR_GAPPED_CONFIG,
        network: {
          ...DEFAULT_AIR_GAPPED_CONFIG.network,
          outboundPorts: [443, 80],
        },
      };

      const invalidValidator = new AirGappedValidator(invalidConfig);
      const result = await invalidValidator.validate();

      expect(result.valid).toBe(false);
    });

    it('should detect external hosts violation', async () => {
      const invalidConfig: DeploymentConfig = {
        ...DEFAULT_AIR_GAPPED_CONFIG,
        network: {
          ...DEFAULT_AIR_GAPPED_CONFIG.network,
          allowedHosts: ['external.api.com'],
        },
      };

      const invalidValidator = new AirGappedValidator(invalidConfig);
      const result = await invalidValidator.validate();

      expect(result.valid).toBe(false);
    });
  });

  describe('generateKubernetesManifest', () => {
    it('should generate valid YAML', () => {
      const manifest = validator.generateKubernetesManifest();

      expect(manifest).toContain('apiVersion: v1');
      expect(manifest).toContain('kind: Namespace');
      expect(manifest).toContain('name: clawskill-system');
      expect(manifest).toContain('TELEMETRY_ENABLED: "false"');
      expect(manifest).toContain('OFFLINE_MODE: "true"');
    });

    it('should include network policy', () => {
      const manifest = validator.generateKubernetesManifest();

      expect(manifest).toContain('kind: NetworkPolicy');
      expect(manifest).toContain('deny-egress');
    });
  });
});

describe('OfflineIndexPackageManager', () => {
  let manager: OfflineIndexPackageManager;

  beforeEach(() => {
    manager = new OfflineIndexPackageManager('/test/path');
  });

  describe('importPackage', () => {
    it('should import package successfully', async () => {
      const pkg = await manager.importPackage('/test/package.tar.gz');

      expect(pkg.id).toBeDefined();
      expect(pkg.version).toBe('2026-03-31');
      expect(pkg.metadata.totalSkills).toBeGreaterThan(0);
    });

    it('should track imported packages', async () => {
      const pkg1 = await manager.importPackage('/test/package1.tar.gz');
      const pkg2 = await manager.importPackage('/test/package2.tar.gz');

      const packages = manager.getImportedPackages();

      expect(packages.length).toBe(2);
      expect(packages.map(p => p.id)).toContain(pkg1.id);
      expect(packages.map(p => p.id)).toContain(pkg2.id);
    });
  });

  describe('verifyPackage', () => {
    it('should verify valid package', async () => {
      const pkg = await manager.importPackage('/test/package.tar.gz');
      const result = await manager.verifyPackage(pkg);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing signature', async () => {
      const pkg = await manager.importPackage('/test/package.tar.gz');
      pkg.metadata.gpgSignature = '';

      const result = await manager.verifyPackage(pkg);

      expect(result.errors.some(e => e.includes('signature'))).toBe(true);
    });
  });

  describe('getLatestPackage', () => {
    it('should return null when no packages', () => {
      const latest = manager.getLatestPackage();
      expect(latest).toBeNull();
    });

    it('should return most recent package', async () => {
      const pkg1 = await manager.importPackage('/test/old.tar.gz');
      pkg1.createdAt = new Date('2026-01-01');

      const pkg2 = await manager.importPackage('/test/new.tar.gz');
      pkg2.createdAt = new Date('2026-03-31');

      const latest = manager.getLatestPackage();

      expect(latest?.id).toBe(pkg2.id);
    });
  });
});

describe('TelemetryControl', () => {
  let telemetry: TelemetryControl;

  beforeEach(() => {
    telemetry = TelemetryControl.getInstance();
    telemetry.disable();
  });

  it('should be disabled by default', () => {
    expect(telemetry.isEnabled()).toBe(false);
  });

  it('should remain disabled after disable call', () => {
    telemetry.disable();
    expect(telemetry.isEnabled()).toBe(false);
  });

  it('should not throw when tracking events', () => {
    expect(() => {
      telemetry.trackEvent('test-event', { foo: 'bar' });
    }).not.toThrow();
  });

  it('should not throw when tracking exceptions', () => {
    expect(() => {
      telemetry.trackException(new Error('test error'));
    }).not.toThrow();
  });
});

describe('Deployment Configurations', () => {
  it('should have valid default config', () => {
    expect(DEFAULT_AIR_GAPPED_CONFIG.mode).toBe('air-gapped');
    expect(DEFAULT_AIR_GAPPED_CONFIG.network.allowInternet).toBe(false);
    expect(DEFAULT_AIR_GAPPED_CONFIG.network.allowTelemetry).toBe(false);
    expect(DEFAULT_AIR_GAPPED_CONFIG.indexing.offlineMode).toBe(true);
  });

  it('should have correct storage config', () => {
    expect(DEFAULT_AIR_GAPPED_CONFIG.storage.type).toBe('local');
    expect(DEFAULT_AIR_GAPPED_CONFIG.storage.sizeGB).toBeGreaterThan(0);
  });

  it('should have correct security config', () => {
    expect(DEFAULT_AIR_GAPPED_CONFIG.security.tlsEnabled).toBe(true);
    expect(DEFAULT_AIR_GAPPED_CONFIG.security.rbacEnabled).toBe(true);
    expect(DEFAULT_AIR_GAPPED_CONFIG.security.auditLogging).toBe(true);
  });
});