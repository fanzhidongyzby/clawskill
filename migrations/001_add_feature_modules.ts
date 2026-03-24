/**
 * Database Migration for ClawSkill Feature Modules
 * 为新增的功能模块创建数据库表
 */

import { Kysely, sql } from 'kysely';

/**
 * Migration up
 */
export async function up(db: Kysely<any>): Promise<void> {
  // GitHub Sources 表
  await db.schema
    .createTable('github_sources')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('owner', 'text', (col) => col.notNull())
    .addColumn('repo', 'text', (col) => col.notNull())
    .addColumn('skill_id', 'text', (col) => col.notNull())
    .addColumn('stars', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('language', 'text', (col) => col.notNull())
    .addColumn('topics', 'jsonb', (col) => col.notNull().defaultTo('[]'))
    .addColumn('last_synced_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint(['owner', 'repo'])
    .execute();

  // Embeddings 表
  await db.schema
    .createTable('embeddings')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('skill_id', 'text', (col) => col.notNull())
    .addColumn('version', 'text', (col) => col.notNull())
    .addColumn('content_type', 'text', (col) => col.notNull())
    .addColumn('content_text', 'text', (col) => col.notNull())
    .addColumn('vector', 'real[]', (col) => col.notNull())
    .addColumn('model_name', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // 创建向量索引（需要 pgvector 扩展）
  await sql`CREATE EXTENSION IF NOT EXISTS vector`.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings USING ivfflat (vector vector_cosine_ops)`.execute(db);

  // Search History 表
  await db.schema
    .createTable('search_history')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('query', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text', (col) => col.nullable())
    .addColumn('results_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('filters', 'jsonb', (col) => col.nullable())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // Security Scans 表
  await db.schema
    .createTable('security_scans')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('skill_id', 'text', (col) => col.notNull())
    .addColumn('version', 'text', (col) => col.notNull())
    .addColumn('scan_type', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull())
    .addColumn('findings', 'jsonb', (col) => col.nullable())
    .addColumn('severity_counts', 'jsonb', (col) => col.nullable())
    .addColumn('started_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('completed_at', 'timestamp', (col) => col.nullable())
    .execute();

  // Security Findings 表
  await db.schema
    .createTable('security_findings')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('scan_id', 'integer', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('severity', 'text', (col) => col.notNull())
    .addColumn('file_path', 'text', (col) => col.notNull())
    .addColumn('line_number', 'integer', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('remediation', 'text', (col) => col.nullable())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addForeignKeyConstraint('fk_scan_id', ['scan_id'], 'security_scans', ['id'])
    .execute();

  // 创建索引
  await db.schema
    .createIndex('security_scans_skill_id_idx')
    .on('security_scans')
    .column('skill_id')
    .execute();

  await db.schema
    .createIndex('security_scans_status_idx')
    .on('security_scans')
    .column('status')
    .execute();

  await db.schema
    .createIndex('security_findings_scan_id_idx')
    .on('security_findings')
    .column('scan_id')
    .execute();

  await db.schema
    .createIndex('security_findings_severity_idx')
    .on('security_findings')
    .column('severity')
    .execute();
}

/**
 * Migration down
 */
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('security_findings').ifExists().execute();
  await db.schema.dropTable('security_scans').ifExists().execute();
  await db.schema.dropTable('search_history').ifExists().execute();
  await db.schema.dropTable('embeddings').ifExists().execute();
  await db.schema.dropTable('github_sources').ifExists().execute();
}