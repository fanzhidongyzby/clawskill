import { describe, it, expect } from 'vitest';
import { parseSkillMd, extractFrontmatter } from './parser';

const validSkillMd = `---
name: weather
namespace: openclaw
version: 1.0.0
description: Get weather forecasts
author: OpenClaw Team
license: MIT
keywords:
  - weather
  - forecast
categories:
  - utility
install:
  openclaw: openclaw clawhub install weather
---

# Weather Skill

Get current weather and forecasts.

## Usage

\`\`\`bash
openclaw clawhub install openclaw/weather
\`\`\`
`;

describe('parseSkillMd', () => {
  it('parses valid SKILL.md', () => {
    const result = parseSkillMd(validSkillMd);

    expect(result.name).toBe('weather');
    expect(result.namespace).toBe('openclaw');
    expect(result.version).toBe('1.0.0');
    expect(result.description).toBe('Get weather forecasts');
    expect(result.author).toBe('OpenClaw Team');
    expect(result.license).toBe('MIT');
    expect(result.keywords).toContain('weather');
    expect(result.categories).toContain('utility');
    expect(result.installCommands).toHaveLength(1);
    expect(result.installCommands[0]).toEqual({
      platform: 'openclaw',
      command: 'openclaw clawhub install weather',
    });
  });

  it('generates ID from namespace/name', () => {
    const result = parseSkillMd(validSkillMd);
    expect(result.id).toBe('openclaw/weather');
  });

  it('uses default version if not specified', () => {
    const content = `---
name: test
namespace: myorg
---
Content`;
    const result = parseSkillMd(content);
    expect(result.version).toBe('0.0.1');
  });

  it('extracts content after frontmatter', () => {
    const result = parseSkillMd(validSkillMd);
    expect(result.content).toContain('# Weather Skill');
  });

  it('throws for missing frontmatter', () => {
    expect(() => parseSkillMd('No frontmatter here')).toThrow('missing frontmatter');
  });

  it('throws for missing required fields', () => {
    const content = `---
name: test
---
Content`;
    expect(() => parseSkillMd(content)).toThrow('namespace are required');
  });
});

describe('extractFrontmatter', () => {
  it('extracts frontmatter object', () => {
    const result = extractFrontmatter(validSkillMd);
    expect(result).toEqual({
      name: 'weather',
      namespace: 'openclaw',
      version: '1.0.0',
      description: 'Get weather forecasts',
      author: 'OpenClaw Team',
      license: 'MIT',
      keywords: ['weather', 'forecast'],
      categories: ['utility'],
      install: {
        openclaw: 'openclaw clawhub install weather',
      },
    });
  });

  it('returns null for missing frontmatter', () => {
    expect(extractFrontmatter('No frontmatter')).toBeNull();
  });
});