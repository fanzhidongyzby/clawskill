# Contributing to ClawSkill

感谢你有兴趣为 ClawSkill 做贡献！

## 如何贡献

### 报告 Bug

如果你发现了 bug，请通过 [GitHub Issues](https://github.com/openclaw/clawskill/issues) 提交报告。

提交 bug 报告时，请包含：

1. **描述**: 清晰描述问题
2. **复现步骤**: 如何重现问题
3. **期望行为**: 你期望发生什么
4. **实际行为**: 实际发生了什么
5. **环境**: 操作系统、Go 版本等
6. **日志**: 相关的错误日志或截图

### 提交功能请求

欢迎提交功能请求！请在 Issue 中详细描述：

1. **功能描述**: 你想要的功能
2. **使用场景**: 为什么需要这个功能
3. **替代方案**: 你考虑过的其他方案

### 提交代码

#### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

#### 代码规范

- 遵循 [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- 使用 `gofmt` 格式化代码
- 使用 `golangci-lint` 进行代码检查
- 为新功能编写测试
- 更新相关文档

#### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

类型（type）：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat(skill): add dependency resolution

- Implement semver constraint parsing
- Add conflict detection
- Support version ranges

Closes #123
```

#### 测试规范

- 所有新功能必须有单元测试
- 测试覆盖率应保持在 70% 以上
- 使用 table-driven tests
- 测试命名: `Test<FunctionName>_<Scenario>`

```go
func TestParseSkillURL_Valid(t *testing.T) {
    tests := []struct {
        name     string
        input    string
        expected SkillURL
    }{
        // test cases
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // test implementation
        })
    }
}
```

#### 文档规范

- 使用清晰的中文或英文
- 代码示例要完整可运行
- 保持文档更新

### Pull Request 检查清单

- [ ] 代码通过 `make lint` 检查
- [ ] 代码通过 `make test` 测试
- [ ] 新功能有对应的测试
- [ ] 文档已更新（如适用）
- [ ] 提交信息符合规范

## 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/openclaw/clawskill.git
cd clawskill

# 安装依赖
make deps

# 运行测试
make test

# 启动开发服务器
make dev
```

## 项目结构

```
clawskill/
├── cmd/                    # 命令行入口
├── internal/               # 内部实现
│   ├── skill/              # 技能核心服务
│   ├── search/             # 搜索服务
│   ├── registry/           # 注册表服务
│   └── ...
├── pkg/                    # 公共库
├── api/                    # API 定义
├── docs/                   # 文档
└── migrations/             # 数据库迁移
```

## 获取帮助

- GitHub Issues: https://github.com/openclaw/clawskill/issues
- Discord: https://discord.gg/clawd

再次感谢你的贡献！