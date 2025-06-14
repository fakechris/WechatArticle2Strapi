#!/usr/bin/env node

/**
 * CLI v2 测试脚本
 * 展示如何使用新的 Playwright 版本
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

// 测试URL列表
const testUrls = [
  {
    name: '微信文章',
    url: 'https://mp.weixin.qq.com/s/example',
    description: '测试微信文章提取，自动等待动态内容加载'
  },
  {
    name: 'SPA 应用',
    url: 'https://example-spa.com/article',
    description: '测试 SPA 应用，需要等待 JavaScript 渲染'
  },
  {
    name: '新闻网站',
    url: 'https://example-news.com/article',
    description: '测试一般新闻网站，静态内容'
  }
];

// 测试配置
const testConfigs = [
  {
    name: '基础测试',
    args: '-v',
    description: '基本功能测试，详细输出'
  },
  {
    name: '快速模式',
    args: '--wait-timeout 10000 --headless',
    description: '快速模式，适合批量处理'
  },
  {
    name: '完整模式',
    args: '--load-images --wait-timeout 30000 -v',
    description: '完整模式，加载所有资源'
  },
  {
    name: '调试模式',
    args: '--debug --no-headless --screenshot',
    description: '调试模式，显示浏览器并截图'
  }
];

console.log(chalk.blue('🚀 Article Extractor CLI v2 测试脚本'));
console.log(chalk.gray('=================================================='));

async function runTest(testName, command) {
  console.log(chalk.yellow(`\n📋 ${testName}`));
  console.log(chalk.gray(`命令: ${command}`));
  
  try {
    const startTime = Date.now();
    const output = execSync(command, { 
      encoding: 'utf8',
      timeout: 60000 // 60秒超时
    });
    const endTime = Date.now();
    
    console.log(chalk.green(`✅ 成功 (${endTime - startTime}ms)`));
    
    // 显示部分输出
    const lines = output.split('\n');
    if (lines.length > 10) {
      console.log(chalk.gray('输出预览:'));
      lines.slice(0, 5).forEach(line => {
        console.log(chalk.gray(`  ${line}`));
      });
      console.log(chalk.gray(`  ... (省略 ${lines.length - 10} 行)`));
      lines.slice(-5).forEach(line => {
        console.log(chalk.gray(`  ${line}`));
      });
    } else {
      console.log(chalk.gray('输出:'));
      console.log(chalk.gray(output));
    }
    
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ 失败: ${error.message}`));
    return false;
  }
}

async function main() {
  console.log(chalk.blue('\n🔧 1. 检查安装'));
  
  // 检查是否安装了 Playwright
  console.log(chalk.gray('检查 Playwright 浏览器安装...'));
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    console.log(chalk.green('✅ Playwright 已安装'));
  } catch (error) {
    console.log(chalk.red('❌ Playwright 未安装'));
    console.log(chalk.yellow('正在安装 Playwright 浏览器...'));
    try {
      execSync('npx playwright install chromium', { stdio: 'inherit' });
      console.log(chalk.green('✅ Playwright 浏览器安装完成'));
    } catch (installError) {
      console.log(chalk.red('❌ 安装失败，请手动运行: npx playwright install chromium'));
      return;
    }
  }

  // 检查 CLI v2 是否可用
  console.log(chalk.gray('检查 CLI v2 是否可用...'));
  try {
    execSync('article-extractor-v2 --version', { stdio: 'pipe' });
    console.log(chalk.green('✅ CLI v2 可用'));
  } catch (error) {
    console.log(chalk.red('❌ CLI v2 不可用，请先安装依赖'));
    return;
  }

  console.log(chalk.blue('\n🧪 2. 基础功能测试'));
  
  // 测试基础命令
  const basicTests = [
    {
      name: '版本检查',
      command: 'article-extractor-v2 --version'
    },
    {
      name: '帮助信息',
      command: 'article-extractor-v2 --help'
    },
    {
      name: '浏览器安装状态',
      command: 'article-extractor-v2 install-browsers --help'
    }
  ];

  for (const test of basicTests) {
    await runTest(test.name, test.command);
  }

  console.log(chalk.blue('\n🌐 3. 页面信息测试'));
  
  // 测试页面信息获取
  const pageInfoUrl = 'https://httpbin.org/html';
  await runTest(
    '页面信息获取',
    `article-extractor-v2 page-info "${pageInfoUrl}"`
  );

  console.log(chalk.blue('\n📊 4. 性能对比测试'));
  
  // 性能对比测试
  const testUrl = 'https://example.com';
  
  console.log(chalk.yellow('\n🔄 测试不同配置的性能差异:'));
  
  for (const config of testConfigs) {
    if (config.name !== '调试模式') { // 跳过调试模式以避免弹出浏览器
      const command = `article-extractor-v2 "${testUrl}" ${config.args} --output json`;
      console.log(chalk.gray(`\n📋 ${config.name}: ${config.description}`));
      
      const startTime = Date.now();
      const success = await runTest(config.name, command);
      const endTime = Date.now();
      
      if (success) {
        console.log(chalk.blue(`⏱️  总耗时: ${endTime - startTime}ms`));
      }
    }
  }

  console.log(chalk.blue('\n🎯 5. 实际场景测试'));
  
  // 实际场景测试
  const scenarioTests = [
    {
      name: 'JSON 输出测试',
      command: `article-extractor-v2 "https://example.com" --output json --wait-timeout 10000`,
      description: '测试 JSON 格式输出'
    },
    {
      name: '不同浏览器测试',
      command: `article-extractor-v2 "https://example.com" --browser chromium --wait-timeout 10000`,
      description: '测试 Chromium 浏览器'
    },
    {
      name: '等待策略测试',
      command: `article-extractor-v2 "https://example.com" --wait-for "body" --wait-timeout 10000`,
      description: '测试自定义等待策略'
    }
  ];

  for (const test of scenarioTests) {
    console.log(chalk.gray(`\n📋 ${test.name}: ${test.description}`));
    await runTest(test.name, test.command);
  }

  console.log(chalk.blue('\n✨ 6. 功能特性演示'));
  
  // 功能特性演示
  console.log(chalk.yellow('\n🎨 v2 新增功能:'));
  console.log(chalk.gray('1. 真实浏览器环境 - 支持 JavaScript 执行'));
  console.log(chalk.gray('2. 智能等待策略 - 自动等待内容加载'));
  console.log(chalk.gray('3. 多浏览器支持 - Chromium/Firefox/WebKit'));
  console.log(chalk.gray('4. 反爬虫能力 - 更好的反检测'));
  console.log(chalk.gray('5. 调试功能 - 截图和页面信息'));

  console.log(chalk.yellow('\n🔧 推荐使用场景:'));
  console.log(chalk.gray('• SPA 应用 (React/Vue/Angular)'));
  console.log(chalk.gray('• 动态加载内容的网站'));
  console.log(chalk.gray('• 需要 JavaScript 渲染的页面'));
  console.log(chalk.gray('• 反爬虫较强的网站'));

  console.log(chalk.yellow('\n⚙️  性能优化建议:'));
  console.log(chalk.gray('• 生产环境使用 --headless 模式'));
  console.log(chalk.gray('• 不需要图片时使用默认设置 (禁用图片加载)'));
  console.log(chalk.gray('• 合理设置 --wait-timeout 避免等待过长'));
  console.log(chalk.gray('• 批量处理时适当增加间隔时间'));

  console.log(chalk.green('\n🎉 测试完成！'));
  console.log(chalk.blue('现在您可以开始使用 CLI v2 来提取动态网页内容了！'));
  
  console.log(chalk.yellow('\n📚 快速开始:'));
  console.log(chalk.gray('article-extractor-v2 "YOUR_URL" -v'));
  console.log(chalk.gray('article-extractor-v2 "YOUR_URL" --no-headless -d  # 调试模式'));
  console.log(chalk.gray('article-extractor-v2 "YOUR_URL" --wait-for ".content"  # 等待特定元素'));
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ 未处理的Promise拒绝:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ 未捕获的异常:'), error.message);
  process.exit(1);
});

// 运行主函数
main().catch(error => {
  console.error(chalk.red('❌ 测试脚本运行失败:'), error.message);
  process.exit(1);
}); 