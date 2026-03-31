#!/usr/bin/env tsx
/**
 * ClawSkill 开发启动脚本 - 内存模式
 */

import { createServer } from './src/server/index';

async function main() {
  console.log('🚀 启动 ClawSkill 后端服务 (内存模式)...');
  
  const server = await createServer({
    port: 8080,
    host: '0.0.0.0',
    logger: true,
    skipAuth: true,  // 跳过认证
    inMemory: true,  // 内存数据库
  });

  await server.listen({ port: 8080, host: '0.0.0.0' });

  console.log('✓ 服务已启动: http://0.0.0.0:8080');
  console.log('✓ API 文档: http://0.0.0.0:8080/docs');
  console.log('✓ 健康检查: http://0.0.0.0:8080/health');
  console.log('');
  console.log('按 Ctrl+C 停止服务');
}

main().catch((err) => {
  console.error('启动失败:', err);
  process.exit(1);
});