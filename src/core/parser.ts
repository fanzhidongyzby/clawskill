/**
 * SKILL.md parser - Parse skill metadata from SKILL.md files
 */

import type { ParsedSkillMd, InstallCommand } from '../types/skill';

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

interface Frontmatter {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  keywords?: string | string[];
  categories?: string | string[];
  install?: Record<string, string>;
  homepage?: string;
  repository?: string;
}

/**
 * Parse a SKILL.md file content
 */
export function parseSkillMd(content: string): ParsedSkillMd {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    throw new Error('Invalid SKILL.md: missing frontmatter');
  }

  const [, frontmatterStr, body] = match;
  const frontmatter = parseYamlFrontmatter(frontmatterStr!);

  // Validate required fields
  if (!frontmatter.name || !frontmatter.namespace) {
    throw new Error('Invalid SKILL.md: name and namespace are required');
  }

  // Generate ID from namespace/name
  const id = frontmatter.id ?? `${frontmatter.namespace}/${frontmatter.name}`;
  const version = frontmatter.version ?? '0.0.1';

  // Parse keywords and categories
  const keywords = parseStringArray(frontmatter.keywords);
  const categories = parseStringArray(frontmatter.categories);

  // Parse install commands
  const installCommands = parseInstallCommands(frontmatter.install);

  return {
    id,
    name: frontmatter.name,
    namespace: frontmatter.namespace,
    version,
    description: frontmatter.description ?? '',
    author: frontmatter.author ?? '',
    license: frontmatter.license ?? 'MIT',
    keywords,
    categories,
    installCommands,
    content: body!.trim(),
  };
}

/**
 * Extract frontmatter from SKILL.md without parsing body
 */
export function extractFrontmatter(content: string): Frontmatter | null {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    return null;
  }
  return parseYamlFrontmatter(match[1]!);
}

/**
 * Simple YAML parser for frontmatter
 */
function parseYamlFrontmatter(yaml: string): Frontmatter {
  const result: Record<string, unknown> = {};
  let currentKey = '';
  let inArray = false;
  let arrayValues: string[] = [];
  let inNestedObject = false;
  let nestedKey = '';
  const nestedObject: Record<string, string> = {};

  const lines = yaml.split('\n');

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Array item (indented with dash)
    if (line.startsWith('  - ') || line.startsWith('- ')) {
      if (!inArray || !currentKey) continue;
      const value = line.replace(/^(\s*- )/, '').trim();
      arrayValues.push(value);
      continue;
    }

    // Nested object item (indented key: value under a parent key)
    const nestedMatch = line.match(/^  ([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (nestedMatch && inNestedObject) {
      const [, key, value] = nestedMatch;
      if (key && value !== undefined) {
        nestedObject[key] = value;
      }
      continue;
    }

    // End previous array or nested object
    if (inArray && currentKey && arrayValues.length > 0) {
      result[currentKey] = arrayValues;
      arrayValues = [];
      inArray = false;
    }
    if (inNestedObject && nestedKey && Object.keys(nestedObject).length > 0) {
      result[nestedKey] = { ...nestedObject };
      nestedObject['constructor'] = undefined as unknown as string; // Clear
      for (const k of Object.keys(nestedObject)) {
        delete nestedObject[k];
      }
      inNestedObject = false;
    }

    // Key: value
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (!value) {
      // Start of array or nested object
      currentKey = key;
      nestedKey = key;
      inArray = true;
      inNestedObject = true;
      arrayValues = [];
    } else {
      // Simple value
      result[key] = parseScalarValue(value);
      inArray = false;
      inNestedObject = false;
    }
  }

  // End final array or nested object
  if (inArray && currentKey && arrayValues.length > 0) {
    result[currentKey] = arrayValues;
  }
  if (inNestedObject && nestedKey && Object.keys(nestedObject).length > 0) {
    result[nestedKey] = { ...nestedObject };
  }

  return result as Frontmatter;
}

function parseScalarValue(value: string): string | number | boolean {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  const num = Number(value);
  if (!isNaN(num)) return num;

  return value;
}

function parseStringArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  // Comma-separated string
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

function parseInstallCommands(install?: Record<string, string>): InstallCommand[] {
  if (!install) return [];
  return Object.entries(install).map(([platform, command]) => ({
    platform,
    command,
  }));
}

/**
 * Validate a skill ID matches namespace/name
 */
export function validateSkillId(id: string, namespace: string, name: string): boolean {
  const expectedId = `${namespace}/${name}`;
  return id === expectedId;
}