/**
 * Agent Skills 标准验证器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SkillStandardValidator, skillStandardValidator, AgentSkillMetadata } from './skill-standard';
import type { ParsedSkillMd, Skill } from '../types/skill';

const mockValidSkill: ParsedSkillMd = {
  id: 'openclaw/pdf-processor',
  name: 'pdf-processor',
  namespace: 'openclaw',
  version: '1.0.0',
  description: 'Extracts text from PDF files. Use when user mentions PDFs. Supports batch processing and OCR for scanned documents.',
  author: 'openclaw-team',
  license: 'MIT',
  keywords: ['pdf', 'document', 'ocr', 'batch'],
  categories: ['document-processing'],
  installCommands: [],
  content: 'Instructions for PDF processing...',
};

const mockInvalidSkill: ParsedSkillMd = {
  id: 'test/invalid-skill',
  name: 'Invalid_Skill_123', // 大写和下划线，不符合规范
  namespace: 'test',
  version: '0.1.0',
  description: '', // 空描述
  author: 'unknown',
  license: '',
  keywords: [],
  categories: [],
  installCommands: [],
  content: '',
};

const mockSkillWithCompatibility: ParsedSkillMd & { compatibility: string[] } = {
  id: 'openclaw/weather-skill',
  name: 'weather-skill',
  namespace: 'openclaw',
  version: '1.0.0',
  description: 'Get weather information for any location.',
  author: 'openclaw-team',
  license: 'MIT',
  keywords: ['weather', 'forecast'],
  categories: ['information'],
  installCommands: [],
  content: 'Weather skill instructions...',
  compatibility: ['openclaw', 'claude-code', 'cursor'],
};

describe('SkillStandardValidator', () => {
  let validator: SkillStandardValidator;

  beforeEach(() => {
    validator = new SkillStandardValidator();
  });

  describe('validate', () => {
    it('should validate a correct skill', () => {
      const result = validator.validate(mockValidSkill);

      expect(result.compatible).toBe(true);
      expect(result.issues.length).toBe(0);
      expect(result.features.basicParsing).toBe(true);
    });

    it('should reject skill with invalid name', () => {
      const result = validator.validate(mockInvalidSkill);

      expect(result.compatible).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(i => i.includes('name'))).toBe(true);
      expect(result.features.basicParsing).toBe(false);
    });

    it('should reject skill with empty description', () => {
      const result = validator.validate(mockInvalidSkill);

      expect(result.issues.some(i => i.includes('description'))).toBe(true);
    });

    it('should warn about missing license', () => {
      const noLicenseSkill = { ...mockValidSkill, license: '' };
      const result = validator.validate(noLicenseSkill);

      expect(result.warnings.some(w => w.includes('license'))).toBe(true);
    });

    it('should detect extended metadata', () => {
      const result = validator.validate(mockValidSkill);

      expect(result.features.extendedMetadata).toBe(true);
    });

    it('should warn about long description', () => {
      const longDescSkill = {
        ...mockValidSkill,
        description: 'A'.repeat(1500), // Exceeds 1024 chars
      };
      const result = validator.validate(longDescSkill);

      expect(result.warnings.some(w => w.includes('exceeds'))).toBe(true);
    });
  });

  describe('validatePlatformCompatibility', () => {
    it('should validate compatibility with declared platforms', () => {
      const result = validator.validatePlatformCompatibility(mockSkillWithCompatibility, 'openclaw');

      expect(result.compatible).toBe(true);
    });

    it('should reject compatibility with undeclared platform', () => {
      const result = validator.validatePlatformCompatibility(mockSkillWithCompatibility, 'gemini-code');

      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.includes('gemini-code'))).toBe(true);
    });

    it('should warn about unknown platform', () => {
      const result = validator.validatePlatformCompatibility(mockValidSkill, 'unknown-platform');

      expect(result.warnings.some(w => w.includes('not officially supported'))).toBe(true);
    });
  });

  describe('generateSkillMd', () => {
    it('should generate valid SKILL.md content', () => {
      const metadata: AgentSkillMetadata = {
        name: 'test-skill',
        description: 'A test skill for demonstration.',
        license: 'MIT',
        compatibility: ['openclaw', 'claude-code'],
        author: 'test-author',
        version: '1.0.0',
        category: 'testing',
        tags: ['test', 'demo'],
        allowedTools: ['fs_read', 'fs_write'],
      };

      const content = validator.generateSkillMd(metadata, 'This is the skill instructions.');

      expect(content).toContain('---');
      expect(content).toContain('name: test-skill');
      expect(content).toContain('license: MIT');
      expect(content).toContain('openclaw');
      expect(content).toContain('claude-code');
      expect(content).toContain('This is the skill instructions.');
    });

    it('should handle minimal metadata', () => {
      const metadata: AgentSkillMetadata = {
        name: 'minimal-skill',
        description: 'Minimal skill.',
      };

      const content = validator.generateSkillMd(metadata, 'Instructions');

      expect(content).toContain('name: minimal-skill');
      expect(content).toContain('description:');
      expect(content).toContain('Instructions');
    });
  });

  describe('normalize', () => {
    it('should normalize skill name to lowercase with hyphens', () => {
      const skill: ParsedSkillMd = {
        ...mockValidSkill,
        name: 'PDF_Processor',
      };

      const normalized = validator.normalize(skill);

      expect(normalized.name).toBe('pdf-processor');
    });

    it('should set default license', () => {
      const skill: ParsedSkillMd = {
        ...mockValidSkill,
        license: '',
      };

      const normalized = validator.normalize(skill);

      expect(normalized.license).toBe('MIT');
    });

    it('should set default category', () => {
      const skill: ParsedSkillMd = {
        ...mockValidSkill,
        categories: [],
      };

      const normalized = validator.normalize(skill);

      expect(normalized.category).toBe('general');
    });
  });

  describe('validateToolUsage', () => {
    it('should allow tool when no restrictions', () => {
      const result = validator.validateToolUsage('fs_read', undefined);

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('No tool restrictions');
    });

    it('should allow explicitly listed tool', () => {
      const result = validator.validateToolUsage('fs_read', ['fs_read', 'fs_write']);

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('explicitly allowed');
    });

    it('should reject non-listed tool', () => {
      const result = validator.validateToolUsage('http_request', ['fs_read', 'fs_write']);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not in allowed list');
    });

    it('should allow wildcard', () => {
      const result = validator.validateToolUsage('any_tool', ['*']);

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Wildcard');
    });

    it('should allow prefix match', () => {
      const result = validator.validateToolUsage('fs_read_file', ['fs_*']);

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('Matches prefix');
    });
  });

  describe('getStandardDirectoryStructure', () => {
    it('should return correct structure', () => {
      const structure = validator.getStandardDirectoryStructure();

      expect(structure['SKILL.md'].required).toBe(true);
      expect(structure['scripts/'].required).toBe(false);
      expect(structure['references/'].required).toBe(false);
      expect(structure['assets/'].required).toBe(false);
    });
  });

  describe('validateDirectoryStructure', () => {
    it('should validate correct structure', () => {
      const files = ['SKILL.md', 'scripts/setup.sh', 'references/README.md'];
      const result = validator.validateDirectoryStructure(files);

      expect(result.valid).toBe(true);
      expect(result.missing.length).toBe(0);
    });

    it('should detect missing required files', () => {
      const files = ['scripts/setup.sh']; // Missing SKILL.md
      const result = validator.validateDirectoryStructure(files);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('SKILL.md');
    });

    it('should detect unexpected files', () => {
      const files = ['SKILL.md', 'unknown_file.txt'];
      const result = validator.validateDirectoryStructure(files);

      expect(result.unexpected).toContain('unknown_file.txt');
    });
  });
});

describe('SkillStandardValidator Edge Cases', () => {
  let validator: SkillStandardValidator;

  beforeEach(() => {
    validator = new SkillStandardValidator();
  });

  it('should handle skill with numeric name', () => {
    const skill: ParsedSkillMd = {
      ...mockValidSkill,
      name: 'skill-123', // Valid: starts with letter
    };

    const result = validator.validate(skill);
    expect(result.compatible).toBe(true);
  });

  it('should reject skill starting with number', () => {
    const skill: ParsedSkillMd = {
      ...mockValidSkill,
      name: '123-skill', // Invalid: starts with number
    };

    const result = validator.validate(skill);
    expect(result.issues.some(i => i.includes('starting with a letter'))).toBe(true);
  });

  it('should handle very long name', () => {
    const skill: ParsedSkillMd = {
      ...mockValidSkill,
      name: 'a'.repeat(70), // Exceeds 64 chars
    };

    const result = validator.validate(skill);
    expect(result.issues.some(i => i.includes('1-64'))).toBe(true);
  });

  it('should handle single character name', () => {
    const skill: ParsedSkillMd = {
      ...mockValidSkill,
      name: 'a', // Valid: single char
    };

    const result = validator.validate(skill);
    expect(result.compatible).toBe(true);
  });

  it('should handle name with multiple consecutive hyphens', () => {
    const skill: ParsedSkillMd = {
      ...mockValidSkill,
      name: 'pdf--processor', // Valid pattern
    };

    const result = validator.validate(skill);
    expect(result.compatible).toBe(true);
  });

  it('should reject name with special characters', () => {
    const skill: ParsedSkillMd = {
      ...mockValidSkill,
      name: 'pdf@processor', // Invalid: @ character
    };

    const result = validator.validate(skill);
    expect(result.compatible).toBe(false);
  });
});