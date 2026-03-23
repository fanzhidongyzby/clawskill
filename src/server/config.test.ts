import { describe, it, expect } from 'vitest';
import { config } from './config';

describe('config', () => {
  it('has default values', () => {
    expect(config.port).toBe(8080);
    expect(config.host).toBe('0.0.0.0');
    expect(config.logLevel).toBeDefined();
    expect(config.corsOrigins).toContain('*');
    expect(config.rateLimitMax).toBe(60);
  });

  it('has database config', () => {
    expect(config.database.host).toBe('localhost');
    expect(config.database.port).toBe(5432);
    expect(config.database.database).toBe('clawskill');
  });

  it('has redis config', () => {
    expect(config.redis.host).toBe('localhost');
    expect(config.redis.port).toBe(6379);
  });

  it('has computed isDev/isProd/isTest', () => {
    expect(typeof config.isDev).toBe('boolean');
    expect(typeof config.isProd).toBe('boolean');
    expect(typeof config.isTest).toBe('boolean');
  });
});
