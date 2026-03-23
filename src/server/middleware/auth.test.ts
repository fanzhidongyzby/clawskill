import { describe, it, expect } from 'vitest';
import { generateApiKey } from './auth';

describe('generateApiKey', () => {
  it('generates a key with cs_ prefix', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^cs_[A-Za-z0-9]{32}$/);
  });

  it('generates unique keys', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateApiKey());
    }
    expect(keys.size).toBe(100);
  });
});
