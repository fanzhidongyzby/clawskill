import { describe, it, expect } from 'vitest';
import { parseSkillUrl, formatSkillUrl, getSkillId, isValidVersion, compareVersions } from './skill-url';
import { InvalidSkillUrl } from '../types/skill';

describe('parseSkillUrl', () => {
  it('parses namespace/name format', () => {
    const result = parseSkillUrl('openclaw/weather');
    expect(result).toEqual({
      namespace: 'openclaw',
      name: 'weather',
      version: undefined,
    });
  });

  it('parses namespace/name@version format', () => {
    const result = parseSkillUrl('openclaw/weather@1.0.0');
    expect(result).toEqual({
      namespace: 'openclaw',
      name: 'weather',
      version: '1.0.0',
    });
  });

  it('parses full HTTPS URL', () => {
    const result = parseSkillUrl('https://clawskill.com/skill/openclaw/weather');
    expect(result).toEqual({
      namespace: 'openclaw',
      name: 'weather',
      version: undefined,
    });
  });

  it('parses full HTTPS URL with version', () => {
    const result = parseSkillUrl('https://clawskill.com/skill/openclaw/weather@2.0.0');
    expect(result).toEqual({
      namespace: 'openclaw',
      name: 'weather',
      version: '2.0.0',
    });
  });

  it('parses pre-release version', () => {
    const result = parseSkillUrl('openclaw/weather@1.0.0-beta.1');
    expect(result.version).toBe('1.0.0-beta.1');
  });

  it('throws for invalid format', () => {
    expect(() => parseSkillUrl('invalid')).toThrow(InvalidSkillUrl);
    expect(() => parseSkillUrl('invalid/')).toThrow(InvalidSkillUrl);
    expect(() => parseSkillUrl('/name')).toThrow(InvalidSkillUrl);
  });

  it('throws for invalid characters', () => {
    expect(() => parseSkillUrl('OpenClaw/weather')).toThrow(InvalidSkillUrl);
    expect(() => parseSkillUrl('openclaw/weather name')).toThrow(InvalidSkillUrl);
  });
});

describe('formatSkillUrl', () => {
  it('formats without version', () => {
    expect(formatSkillUrl({ namespace: 'openclaw', name: 'weather' })).toBe('openclaw/weather');
  });

  it('formats with version', () => {
    expect(formatSkillUrl({ namespace: 'openclaw', name: 'weather', version: '1.0.0' })).toBe('openclaw/weather@1.0.0');
  });
});

describe('getSkillId', () => {
  it('returns namespace/name', () => {
    expect(getSkillId({ namespace: 'openclaw', name: 'weather' })).toBe('openclaw/weather');
  });
});

describe('isValidVersion', () => {
  it('validates semver format', () => {
    expect(isValidVersion('1.0.0')).toBe(true);
    expect(isValidVersion('0.1.0')).toBe(true);
    expect(isValidVersion('10.20.30')).toBe(true);
    expect(isValidVersion('1.0.0-beta')).toBe(true);
    expect(isValidVersion('1.0.0-beta.1')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidVersion('1')).toBe(false);
    expect(isValidVersion('1.0')).toBe(false);
    expect(isValidVersion('v1.0.0')).toBe(false);
    expect(isValidVersion('')).toBe(false);
  });
});

describe('compareVersions', () => {
  it('compares major versions', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
  });

  it('compares minor versions', () => {
    expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
  });

  it('compares patch versions', () => {
    expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
  });

  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
  });
});