declare module 'semver' {
  export function compare(a: string, b: string): number;
  export function rcompare(a: string, b: string): number;
  export function satisfies(version: string, range: string): boolean;
  export function valid(version: string): string | null;
  export function coerce(version: string): { version: string } | null;
  export function parse(version: string): { major: number; minor: number; patch: number; version: string } | null;
  export function gt(v1: string, v2: string): boolean;
  export function lt(v1: string, v2: string): boolean;
  export function gte(v1: string, v2: string): boolean;
  export function lte(v1: string, v2: string): boolean;
  export function eq(v1: string, v2: string): boolean;
  export function neq(v1: string, v2: string): boolean;
  export function inc(version: string, release: string): string | null;
}

declare module 'toposort' {
  export default function toposort(edges: [string, string][]): string[];
  export function toposort(edges: [string, string][]): string[];
}