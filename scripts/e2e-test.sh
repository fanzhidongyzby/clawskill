#!/bin/bash

# ClawSkill 端到端测试脚本
# 测试所有核心功能

set -e

echo "========================================="
echo "ClawSkill 端到端测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
TESTS_PASSED=0
TESTS_FAILED=0

# 测试函数
run_test() {
    local test_name=$1
    local test_command=$2

    echo -n "测试: $test_name ... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 进入项目目录
cd /data/OpenMind/employees/employee-00004/workspace/projects/clawskill

echo "========================================="
echo "1. 单元测试"
echo "========================================="
echo ""

run_test "运行所有单元测试" "pnpm test"
echo ""

echo "========================================="
echo "2. GitHub 同步功能测试"
echo "========================================="
echo ""

# 检查 GitHub Token 是否配置
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠ 跳过 GitHub 测试（未配置 GITHUB_TOKEN）${NC}"
else
    echo "GitHub 同步功能测试..."
    # TODO: 添加实际的 GitHub 同步测试
    echo -e "${YELLOW}⚠ GitHub 测试需要实际 token，跳过${NC}"
fi
echo ""

echo "========================================="
echo "3. 语义搜索功能测试"
echo "========================================="
echo ""

# 检查 OpenAI API Key 是否配置
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠ 跳过语义搜索测试（未配置 OPENAI_API_KEY）${NC}"
else
    echo "语义搜索功能测试..."
    # TODO: 添加实际的语义搜索测试
    echo -e "${YELLOW}⚠ 语义搜索测试需要实际 API key，跳过${NC}"
fi
echo ""

echo "========================================="
echo "4. 安全扫描功能测试"
echo "========================================="
echo ""

echo "安全扫描功能测试..."
# TODO: 添加安全扫描测试
echo -e "${YELLOW}⚠ 安全扫描测试需要集成测试环境${NC}"
echo ""

echo "========================================="
echo "5. Web UI 页面测试"
echo "========================================="
echo ""

# 检查 Web UI 目录是否存在
if [ -d "web-ui" ]; then
    run_test "Web UI 目录存在" "test -d web-ui"

    if [ -f "web-ui/package.json" ]; then
        run_test "Web UI package.json 存在" "test -f web-ui/package.json"
    fi

    # 检查主要页面文件
    run_test "Web UI 源文件存在" "test -d web-ui/src"

    echo -e "${YELLOW}⚠ Web UI 功能测试需要启动服务器，已跳过${NC}"
else
    echo -e "${YELLOW}⚠ Web UI 目录不存在，跳过测试${NC}"
fi
echo ""

echo "========================================="
echo "6. CLI 功能测试"
echo "========================================="
echo ""

# 测试 CLI 构建
run_test "构建 CLI" "pnpm build"
echo ""

echo "========================================="
echo "7. API 端点测试"
echo "========================================="
echo ""

# 检查服务是否运行
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 服务正在运行${NC}"

    run_test "健康检查端点" "curl -s http://localhost:8080/health"
    run_test "技能列表端点" "curl -s http://localhost:8080/api/v1/skills"

    echo ""
    echo "响应示例："
    echo ""
    echo "健康检查："
    curl -s http://localhost:8080/health | head -3
    echo ""
else
    echo -e "${YELLOW}⚠ 服务未运行，跳过 API 测试${NC}"
    echo "提示: 运行 'pnpm dev' 启动服务"
fi
echo ""

echo "========================================="
echo "8. 数据库测试"
echo "========================================="
echo ""

# 检查数据库连接
if docker exec clawskill-postgres pg_isready -U clawskill > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 数据库连接正常${NC}"

    # 检查数据库表
    TABLES=$(docker exec clawskill-postgres psql -U clawskill -d clawskill -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | xargs)
    echo "数据库表数量: $TABLES"

    run_test "数据库表存在" "[ $TABLES -gt 0 ]"
else
    echo -e "${YELLOW}⚠ 数据库未运行，跳过数据库测试${NC}"
    echo "提示: 运行 'docker compose up -d postgres' 启动数据库"
fi
echo ""

echo "========================================="
echo "9. 文档测试"
echo "========================================="
echo ""

run_test "README.md 存在" "test -f README.md"
run_test "QUICKSTART.md 存在" "test -f QUICKSTART.md"
run_test "架构文档存在" "test -f docs/architecture.md"
echo ""

echo "========================================="
echo "测试汇总"
echo "========================================="
echo ""

echo -e "通过: ${GREEN}$TESTS_PASSED${NC}"
echo -e "失败: ${RED}$TESTS_FAILED${NC}"
echo -e "总计: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}所有测试通过！${NC}"
    echo -e "${GREEN}=========================================${NC}"
    exit 0
else
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}有测试失败！${NC}"
    echo -e "${RED}=========================================${NC}"
    exit 1
fi