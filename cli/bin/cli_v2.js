#!/usr/bin/env node

/**
 * CLI v2 入口文件 - 使用 Playwright 无头浏览器
 * 支持动态渲染的网页内容提取
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fsAsync from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';
import validator from 'validator';
import { PlaywrightAdapter } from '../src/adapters/playwright-adapter.js';
import { isWeChatArticleUrl } from '../../shared/utils/url-utils.js';
import ConfigManager from '../src/config.js';

/**
 * 验证URL是否有效（符合RFC规范）
 * @param {string} url - URL字符串
 * @returns {boolean} 是否有效
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // 使用validator库进行RFC规范的URL验证
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: true,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
    allow_fragments: true,
    allow_query_components: true,
    validate_length: true
  });
}

const program = new Command();

// 读取package.json获取版本信息
const packagePath = new URL('../package.json', import.meta.url);
const packageInfo = JSON.parse(readFileSync(packagePath, 'utf8'));

program
  .name('wechat-extractor-v2')
  .description('微信文章内容提取工具 - Playwright版本 (支持动态渲染)')
  .version(packageInfo.version);

program
  .argument('<url>', '微信文章或网页URL')
  .option('-c, --config <path>', '配置文件路径')
  .option('-v, --verbose', '显示详细输出')
  .option('-d, --debug', '启用调试模式')
  .option('--strapi', '发送提取的数据到Strapi CMS', false)
  .option('--upload-images', '上传图片到Strapi媒体库 (需要 --strapi)', false)
  .option('--head-image', '上传头图/封面图到Strapi (需要 --strapi)', false)
  .option('--head-image-index <number>', '用作头图的图片索引 (0 = 第一张)', '0')
  .option('--timeout <ms>', '请求超时时间(毫秒)', '30000')
  .option('--output <format>', '输出格式 (json|report)', 'report')
  .option('--max-images <number>', '最大处理图片数量', '10')
  .option('--quality <number>', '图片压缩质量 (0-1)', '0.8')
  // Playwright 特有选项
  .option('--browser <type>', '浏览器类型 (chromium|firefox|webkit)', 'chromium')
  .option('--headless', '无头模式运行', true)
  .option('--no-headless', '有头模式运行 (显示浏览器窗口)')
  .option('--wait-for <selector>', '等待特定CSS选择器出现')
  .option('--wait-timeout <ms>', '页面加载等待超时时间(毫秒)', '30000')
  .option('--load-images', '加载页面图片资源', false)
  .option('--viewport <size>', '浏览器视窗大小 (格式: 宽x高)', '1920x1080')
  .option('--user-data-dir <path>', '浏览器用户数据目录')
  .option('--screenshot', '调试模式下保存页面截图')
  .action(async (url, options) => {
    try {
      // 验证URL
      if (!isValidUrl(url)) {
        console.error(chalk.red('❌ 错误: 请提供有效的URL'));
        process.exit(1);
      }

      // 解析视窗大小
      let viewport = { width: 1920, height: 1080 };
      if (options.viewport) {
        const [width, height] = options.viewport.split('x').map(v => parseInt(v));
        if (width && height) {
          viewport = { width, height };
        }
      }

      // 加载配置
      const configManager = new ConfigManager(options.config);
      let config = null;
      
      if (options.strapi) {
        const configLoaded = await configManager.load();
        if (!configLoaded) {
          console.log(chalk.yellow('⚠️ 没有找到配置文件。正在创建模板...'));
          const configPath = await configManager.createTemplate();
          console.log(chalk.yellow(`📝 请编辑 ${configPath} 中的Strapi设置后再使用 --strapi`));
          process.exit(1);
        }
        config = configManager.get();
        
        // 验证Strapi配置
        const validation = configManager.validate();
        if (!validation.valid) {
          console.error(chalk.red('❌ Strapi配置错误:'));
          validation.errors.forEach(error => {
            console.error(chalk.red(`  • ${error}`));
          });
          process.exit(1);
        }
        
        // 应用CLI选项覆盖配置
        if (options.uploadImages || options.headImage) {
          config.advancedSettings = config.advancedSettings || {};
          config.advancedSettings.uploadImages = options.uploadImages;
          config.advancedSettings.uploadHeadImg = options.headImage;
          config.advancedSettings.headImgIndex = parseInt(options.headImageIndex);
          config.advancedSettings.maxImages = parseInt(options.maxImages);
          config.advancedSettings.imageQuality = parseFloat(options.quality);
        }
      }
      
      // 创建 Playwright 适配器
      const adapterOptions = {
        verbose: options.verbose,
        debug: options.debug,
        timeout: parseInt(options.timeout),
        strapiConfig: config,
        playwright: {
          browser: options.browser,
          headless: options.headless,
          waitForSelector: options.waitFor,
          waitTimeout: parseInt(options.waitTimeout),
          loadImages: options.loadImages,
          viewport: viewport,
          userDataDir: options.userDataDir
        }
      };

      const adapter = new PlaywrightAdapter(adapterOptions);

      // 显示开始信息
      if (options.verbose) {
        console.log(chalk.blue('🚀 微信文章提取工具 - Playwright版本'));
        console.log(chalk.gray(`版本: ${packageInfo.version}`));
        console.log(chalk.gray(`URL: ${url}`));
        console.log('='.repeat(50));
        
        console.log(chalk.gray('设置:'));
        console.log(chalk.gray(`  浏览器: ${options.browser}`));
        console.log(chalk.gray(`  无头模式: ${options.headless ? '✅ 是' : '❌ 否'}`));
        console.log(chalk.gray(`  视窗大小: ${viewport.width}x${viewport.height}`));
        console.log(chalk.gray(`  加载图片: ${options.loadImages ? '✅ 是' : '❌ 否'}`));
        console.log(chalk.gray(`  等待超时: ${options.waitTimeout}ms`));
        if (options.waitFor) {
          console.log(chalk.gray(`  等待选择器: ${options.waitFor}`));
        }
        console.log(chalk.gray(`  配置: ${config ? '✅ 已加载' : '❌ 使用默认'}`));
        console.log(chalk.gray(`  Strapi: ${options.strapi ? '✅ 启用' : '❌ 禁用'}`));
        if (options.strapi) {
          console.log(chalk.gray(`  上传图片: ${options.uploadImages ? '✅ 是' : '❌ 否'}`));
          console.log(chalk.gray(`  头图: ${options.headImage ? `✅ 索引 ${options.headImageIndex}` : '❌ 否'}`));
        }
      }

      // 执行提取
      const startTime = Date.now();
      const result = await adapter.extractFromUrl(url);
      const endTime = Date.now();

      // 调试模式下截图
      if (options.debug && options.screenshot) {
        try {
          await adapter.takeScreenshot(url);
        } catch (screenshotError) {
          console.log(chalk.yellow(`⚠️ 截图失败: ${screenshotError.message}`));
        }
      }

      // 输出结果
      if (options.output === 'json') {
        const jsonOutput = JSON.stringify(result, null, 2);
        console.log(jsonOutput);

        // Save JSON to file
        const outputDir = path.join(process.cwd(), 'output');
        const outputFilePath = path.join(outputDir, 'article_output.json');
        try {
          await fsAsync.mkdir(outputDir, { recursive: true });
          await fsAsync.writeFile(outputFilePath, jsonOutput);
          console.log(chalk.green(`📄 JSON output saved to ${outputFilePath}`));
        } catch (error) {
          console.error(chalk.red(`❌ Error saving JSON to file: ${error.message}`));
          // Optionally set process.exitCode = 1 here if saving is critical
        }
      } else {
        adapter.printExtractionReport(result);
        
        if (options.verbose) {
          console.log(chalk.blue(`\n⏱️  总耗时: ${endTime - startTime}ms`));
          console.log(chalk.gray(`🌐 使用浏览器: ${options.browser}`));
        }
      }

    } catch (error) {
      console.error(chalk.red(`❌ 提取失败: ${error.message}`));
      
      if (options.debug) {
        console.error(chalk.gray('\n调试信息:'));
        console.error(error.stack);
      }
      
      // 提供解决建议
      if (error.message.includes('browser')) {
        console.log(chalk.yellow('\n💡 提示: 确保已安装 Playwright 浏览器:'));
        console.log(chalk.gray('  npx playwright install chromium'));
      }
      
      process.exit(1);
    }
  });

// 浏览器管理命令
program
  .command('install-browsers')
  .description('安装 Playwright 浏览器')
  .option('--chromium', '只安装 Chromium')
  .option('--firefox', '只安装 Firefox')
  .option('--webkit', '只安装 WebKit')
  .action(async (options) => {
    const { execSync } = await import('child_process');
    
    try {
      console.log(chalk.blue('📦 安装 Playwright 浏览器...'));
      
      let command = 'npx playwright install';
      
      if (options.chromium) command += ' chromium';
      else if (options.firefox) command += ' firefox';
      else if (options.webkit) command += ' webkit';
      
      execSync(command, { stdio: 'inherit' });
      console.log(chalk.green('✅ 浏览器安装完成!'));
      
    } catch (error) {
      console.error(chalk.red(`❌ 浏览器安装失败: ${error.message}`));
      process.exit(1);
    }
  });

// 页面信息命令
program
  .command('page-info <url>')
  .description('获取页面详细信息 (调试用)')
  .option('--browser <type>', '浏览器类型', 'chromium')
  .option('--headless', '无头模式', true)
  .action(async (url, options) => {
    try {
      if (!isValidUrl(url)) {
        console.error(chalk.red('❌ 错误: 请提供有效的URL'));
        process.exit(1);
      }

      const adapter = new PlaywrightAdapter({
        debug: true,
        playwright: {
          browser: options.browser,
          headless: options.headless
        }
      });

      console.log(chalk.blue('🔍 获取页面信息...'));
      const pageInfo = await adapter.getPageInfo(url);
      
      console.log(chalk.green('\n📄 页面信息:'));
      console.log(JSON.stringify(pageInfo, null, 2));

    } catch (error) {
      console.error(chalk.red(`❌ 获取页面信息失败: ${error.message}`));
      process.exit(1);
    }
  });

// 页面结构调试命令
program
  .command('debug-structure <url>')
  .description('调试页面内容结构 (用于定位提取问题)')
  .option('--browser <type>', '浏览器类型', 'chromium')
  .option('--headless', '无头模式', true)
  .action(async (url, options) => {
    try {
      if (!isValidUrl(url)) {
        console.error(chalk.red('❌ 错误: 请提供有效的URL'));
        process.exit(1);
      }

      const adapter = new PlaywrightAdapter({
        debug: true,
        playwright: {
          browser: options.browser,
          headless: options.headless,
          waitTimeout: 20000  // 更长的等待时间用于调试
        }
      });

      console.log(chalk.blue('🔍 分析页面结构...'));
      const structureInfo = await adapter.debugPageStructure(url);
      
      console.log(chalk.green('\n🏗️  页面结构分析:'));
      console.log(chalk.yellow(`📝 页面标题: ${structureInfo.title}`));
      console.log(chalk.yellow(`📊 页面文本长度: ${structureInfo.bodyTextLength} 字符`));
      console.log(chalk.yellow(`🔢 总元素数量: ${structureInfo.totalElements}`));
      console.log(chalk.yellow(`📜 脚本数量: ${structureInfo.scripts}`));
      console.log(chalk.yellow(`🖼️  图片数量: ${structureInfo.images}`));
      
      if (structureInfo.potentialContentAreas.length > 0) {
        console.log(chalk.green('\n🎯 潜在内容区域:'));
        structureInfo.potentialContentAreas.forEach((area, index) => {
          console.log(chalk.cyan(`\n${index + 1}. ${area.tagName}`));
          console.log(chalk.gray(`   类名: ${area.className}`));
          console.log(chalk.gray(`   ID: ${area.id}`));
          console.log(chalk.gray(`   文本长度: ${area.textLength} 字符`));
          console.log(chalk.gray(`   子元素数量: ${area.childrenCount}`));
          console.log(chalk.gray(`   内容预览: ${area.innerHTML.substring(0, 100)}...`));
        });
      } else {
        console.log(chalk.red('\n❌ 未找到潜在的内容区域'));
      }

    } catch (error) {
      console.error(chalk.red(`❌ 页面结构分析失败: ${error.message}`));
      process.exit(1);
    }
  });

// 内容质量检查命令
program
  .command('check-quality <url>')
  .description('检查页面内容提取质量 (推荐用于调试)')
  .option('--browser <type>', '浏览器类型', 'chromium')
  .option('--headless', '无头模式', true)
  .option('--wait-timeout <ms>', '等待超时时间', '30000')
  .action(async (url, options) => {
    try {
      if (!isValidUrl(url)) {
        console.error(chalk.red('❌ 错误: 请提供有效的URL'));
        process.exit(1);
      }

      const adapter = new PlaywrightAdapter({
        debug: true,
        playwright: {
          browser: options.browser,
          headless: options.headless,
          waitTimeout: parseInt(options.waitTimeout)
        }
      });

      console.log(chalk.blue('🔍 检查内容质量...'));
      const qualityReport = await adapter.checkContentQuality(url);
      
      console.log(chalk.green('\n📊 内容质量报告:'));
      console.log(chalk.yellow(`📝 页面标题: ${qualityReport.title}`));
      console.log(chalk.yellow(`📊 页面文本长度: ${qualityReport.bodyTextLength} 字符`));
      console.log(chalk.yellow(`🔍 关键词匹配: ${qualityReport.hasKeywords ? '✅ 是' : '❌ 否'}`));
      if (qualityReport.keywordMatches.length > 0) {
        console.log(chalk.cyan(`   匹配的关键词: ${qualityReport.keywordMatches.join(', ')}`));
      }
      console.log(chalk.yellow(`🖼️  图片总数: ${qualityReport.imageCount}`));
      console.log(chalk.yellow(`👁️  可见图片数: ${qualityReport.visibleImageCount}`));
      console.log(chalk.yellow(`📜 脚本数量: ${qualityReport.scriptCount}`));
      console.log(chalk.yellow(`📄 文档状态: ${qualityReport.readyState}`));
      
      if (qualityReport.contentAreas.length > 0) {
        console.log(chalk.green('\n🎯 最佳内容区域:'));
        qualityReport.contentAreas.forEach((area, index) => {
          console.log(chalk.cyan(`\n${index + 1}. ${area.selector}`));
          console.log(chalk.gray(`   类名: ${area.className}`));
          console.log(chalk.gray(`   ID: ${area.id}`));
          console.log(chalk.gray(`   文本长度: ${area.textLength} 字符`));
          console.log(chalk.gray(`   包含图片: ${area.hasImages} 张`));
          console.log(chalk.gray(`   内容预览: ${area.textPreview}`));
        });
      }
      
      if (qualityReport.imageDetails.length > 0) {
        console.log(chalk.green('\n🖼️  图片详情:'));
        qualityReport.imageDetails.forEach((img, index) => {
          console.log(chalk.cyan(`\n${index + 1}. ${img.src}`));
          console.log(chalk.gray(`   Alt: ${img.alt}`));
          console.log(chalk.gray(`   尺寸: ${img.width}x${img.height}`));
        });
      }
      
      // 质量评估
      console.log(chalk.green('\n📈 质量评估:'));
      const hasGoodContent = qualityReport.bodyTextLength > 2000 && qualityReport.hasKeywords;
      const hasImages = qualityReport.visibleImageCount > 0;
      
      console.log(chalk[hasGoodContent ? 'green' : 'red'](`✅ 内容质量: ${hasGoodContent ? '良好' : '需要改进'}`));
      console.log(chalk[hasImages ? 'green' : 'yellow'](`🖼️  图片情况: ${hasImages ? '正常' : '无图片或未加载'}`));
      
      if (!hasGoodContent) {
        console.log(chalk.yellow('\n💡 建议:'));
        console.log(chalk.gray('• 增加等待时间 (--wait-timeout 45000)'));
        console.log(chalk.gray('• 启用图片加载 (--load-images)'));
        console.log(chalk.gray('• 使用有头模式观察页面 (--no-headless)'));
      }

    } catch (error) {
      console.error(chalk.red(`❌ 内容质量检查失败: ${error.message}`));
      process.exit(1);
    }
  });

// 配置模版生成命令（复用原来的逻辑）
program
  .command('init')
  .description('生成配置文件模板')
  .option('-o, --output <path>', '输出路径', './wechat-config.json')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager(options.output);
      const configPath = await configManager.createTemplate();
      console.log(chalk.green(`✅ 配置文件已生成: ${configPath}`));
      console.log(chalk.blue('\n📖 编辑配置文件来设置您的Strapi设置:'));
      console.log(chalk.gray('  - strapiUrl: 您的Strapi实例URL'));
      console.log(chalk.gray('  - token: 来自Strapi管理面板的API令牌'));
      console.log(chalk.gray('  - collection: 您的Strapi集合名称'));
      console.log(chalk.gray('  - fieldMapping: 将文章字段映射到您的Strapi字段'));
      
    } catch (error) {
      console.error(chalk.red(`❌ 生成配置文件失败: ${error.message}`));
      process.exit(1);
    }
  });

// Chrome扩展备份导入命令（复用原来的逻辑）
program
  .command('import-chrome-backup')
  .description('导入Chrome扩展备份文件')
  .argument('<backup-path>', 'Chrome扩展备份文件路径')
  .option('-c, --config <path>', '目标配置文件路径')
  .action(async (backupPath, options) => {
    try {
      const configManager = new ConfigManager(options.config);
      const result = await configManager.loadFromChromeBackup(backupPath);
      await configManager.save();
      
      console.log(chalk.green('✅ Chrome扩展备份导入成功!'));
      console.log(chalk.gray(`  备份时间戳: ${result.timestamp}`));
      
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️ 警告:'));
        result.warnings.forEach(warning => {
          console.log(chalk.yellow(`  • ${warning}`));
        });
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ 导入失败: ${error.message}`));
      process.exit(1);
    }
  });

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ 未处理的Promise拒绝:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ 未捕获的异常:'), error.message);
  process.exit(1);
});

// 处理 SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 正在退出...'));
  process.exit(0);
});

program.parse();