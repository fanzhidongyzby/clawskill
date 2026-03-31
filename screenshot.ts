#!/usr/bin/env tsx
/**
 * ClawSkill 页面截图脚本
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/data/OpenMind/shared/screenshots/clawskill';
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8080';

// 确保截图目录存在
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 启动截图任务...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const screenshots: { name: string; path: string }[] = [];

  try {
    // 1. Dashboard 首页
    console.log('📸 截取首页...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await wait(2000);
    const homePath = path.join(SCREENSHOT_DIR, '01-dashboard-home.png');
    await page.screenshot({ path: homePath, fullPage: true });
    screenshots.push({ name: 'Dashboard首页', path: homePath });
    console.log(`✓ 已保存: ${homePath}`);

    // 2. 技能浏览页面
    console.log('📸 截取技能浏览页面...');
    await page.goto(`${BASE_URL}/browse`, { waitUntil: 'networkidle2' });
    await wait(2000);
    const browsePath = path.join(SCREENSHOT_DIR, '02-skill-browse.png');
    await page.screenshot({ path: browsePath, fullPage: true });
    screenshots.push({ name: '技能浏览页面', path: browsePath });
    console.log(`✓ 已保存: ${browsePath}`);

    // 3. 技能搜索页面
    console.log('📸 截取技能搜索页面...');
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle2' });
    await wait(2000);
    
    // 尝试输入搜索词
    try {
      const searchInput = await page.$('input[type="text"]');
      if (searchInput) {
        await searchInput.type('weather');
        await wait(1500);
      }
    } catch (e) {
      console.log('  搜索输入框未找到，继续截图');
    }
    
    const searchPath = path.join(SCREENSHOT_DIR, '03-skill-search.png');
    await page.screenshot({ path: searchPath, fullPage: true });
    screenshots.push({ name: '技能搜索页面', path: searchPath });
    console.log(`✓ 已保存: ${searchPath}`);

    // 4. 技能详情页面
    console.log('📸 截取技能详情页面...');
    await page.goto(`${BASE_URL}/skill/openclaw/weather`, { waitUntil: 'networkidle2' });
    await wait(2000);
    const detailPath = path.join(SCREENSHOT_DIR, '04-skill-detail.png');
    await page.screenshot({ path: detailPath, fullPage: true });
    screenshots.push({ name: '技能详情页面', path: detailPath });
    console.log(`✓ 已保存: ${detailPath}`);

    // 5. Admin 后台管理页面
    console.log('📸 截取Admin后台管理页面...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
    await wait(2000);
    const adminPath = path.join(SCREENSHOT_DIR, '05-admin-dashboard.png');
    await page.screenshot({ path: adminPath, fullPage: true });
    screenshots.push({ name: 'Admin后台管理', path: adminPath });
    console.log(`✓ 已保存: ${adminPath}`);

    // 6. 我的技能页面
    console.log('📸 截取我的技能页面...');
    await page.goto(`${BASE_URL}/manage`, { waitUntil: 'networkidle2' });
    await wait(2000);
    const managePath = path.join(SCREENSHOT_DIR, '06-skill-manage.png');
    await page.screenshot({ path: managePath, fullPage: true });
    screenshots.push({ name: '我的技能页面', path: managePath });
    console.log(`✓ 已保存: ${managePath}`);

    // 7. 用户仪表盘页面
    console.log('📸 截取用户仪表盘页面...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await wait(2000);
    const dashboardPath = path.join(SCREENSHOT_DIR, '07-user-dashboard.png');
    await page.screenshot({ path: dashboardPath, fullPage: true });
    screenshots.push({ name: '用户仪表盘', path: dashboardPath });
    console.log(`✓ 已保存: ${dashboardPath}`);

    // 8. API 文档页面（Swagger UI）
    console.log('📸 截取API文档页面...');
    await page.goto(`${API_URL}/docs`, { waitUntil: 'networkidle2' });
    await wait(3000);
    const apiDocsPath = path.join(SCREENSHOT_DIR, '08-api-docs.png');
    await page.screenshot({ path: apiDocsPath, fullPage: true });
    screenshots.push({ name: 'API文档页面', path: apiDocsPath });
    console.log(`✓ 已保存: ${apiDocsPath}`);

    console.log('\n========================================');
    console.log('✅ 截图完成！');
    console.log('========================================\n');
    
    console.log('截图文件列表：');
    for (const s of screenshots) {
      console.log(`  - ${s.name}: ${s.path}`);
    }

  } catch (error) {
    console.error('截图失败:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);