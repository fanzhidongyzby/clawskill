-- 添加安全评分字段
-- 执行时间: 2026-03-24

-- 为 skills 表添加安全评分字段
ALTER TABLE skills
ADD COLUMN security_score INTEGER DEFAULT 0 CHECK (security_score >= 0 AND security_score <= 100);

-- 为 skills 表添加安全评分详情字段
ALTER TABLE skills
ADD COLUMN security_details JSONB;

-- 为 skills 表添加最后安全扫描时间
ALTER TABLE skills
ADD COLUMN last_security_scan_at TIMESTAMP WITH TIME ZONE;

-- 添加索引
CREATE INDEX idx_skills_security_score ON skills(security_score DESC);