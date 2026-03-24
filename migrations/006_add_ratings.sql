-- 创建星级评分表
-- 执行时间: 2026-03-24

-- 创建技能评分表
CREATE TABLE IF NOT EXISTS skill_ratings (
    id VARCHAR(64) PRIMARY KEY,
    skill_id VARCHAR(255) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 添加唯一约束，每个用户只能对每个技能评分一次
    CONSTRAINT unique_rating UNIQUE (skill_id, user_id)
);

-- 创建索引
CREATE INDEX idx_skill_ratings_skill_id ON skill_ratings(skill_id);
CREATE INDEX idx_skill_ratings_user_id ON skill_ratings(user_id);
CREATE INDEX idx_skill_ratings_rating ON skill_ratings(rating);
CREATE INDEX idx_skill_ratings_created_at ON skill_ratings(created_at DESC);

-- 添加注释
COMMENT ON TABLE skill_ratings IS '技能评分表';
COMMENT ON COLUMN skill_ratings.skill_id IS '技能ID';
COMMENT ON COLUMN skill_ratings.user_id IS '用户ID';
COMMENT ON COLUMN skill_ratings.rating IS '评分 (1-5星)';
COMMENT ON COLUMN skill_ratings.comment IS '评论文本';
COMMENT ON COLUMN skill_ratings.created_at IS '创建时间';
COMMENT ON COLUMN skill_ratings.updated_at IS '更新时间';