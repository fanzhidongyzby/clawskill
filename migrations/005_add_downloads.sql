-- 创建下载统计表
-- 执行时间: 2026-03-24

-- 创建技能下载记录表
CREATE TABLE IF NOT EXISTS skill_downloads (
    id VARCHAR(64) PRIMARY KEY,
    skill_id VARCHAR(255) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    version VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    ip_address INET,
    user_agent TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 添加唯一索引，防止重复记录
    CONSTRAINT unique_download UNIQUE (skill_id, version, user_id, ip_address)
);

-- 创建索引
CREATE INDEX idx_skill_downloads_skill_id ON skill_downloads(skill_id);
CREATE INDEX idx_skill_downloads_version ON skill_downloads(version);
CREATE INDEX idx_skill_downloads_user_id ON skill_downloads(user_id);
CREATE INDEX idx_skill_downloads_downloaded_at ON skill_downloads(downloaded_at DESC);

-- 添加注释
COMMENT ON TABLE skill_downloads IS '技能下载记录表';
COMMENT ON COLUMN skill_downloads.skill_id IS '技能ID';
COMMENT ON COLUMN skill_downloads.version IS '版本号';
COMMENT ON COLUMN skill_downloads.user_id IS '用户ID';
COMMENT ON COLUMN skill_downloads.ip_address IS 'IP地址';
COMMENT ON COLUMN skill_downloads.downloaded_at IS '下载时间';