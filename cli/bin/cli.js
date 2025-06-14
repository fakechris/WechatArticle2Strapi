#!/usr/bin/env node

/**
 * 重构后的CLI入口文件
 * 使用统一的核心模块和适配器架构
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import validator from 'validator';
import { CLIAdapter } from '../src/adapters/cli-adapter.js';
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
  .name('wechat-extractor')
  .description('微信文章内容提取工具 - 重构版')
  .version(packageInfo.version);

program
  .argument('<url>', '微信文章URL')
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
  .action(async (url, options) => {
    try {
      // 验证URL - CLI工具支持更广泛的URL格式
      if (!isValidUrl(url)) {
        console.error(chalk.red('❌ 错误: 请提供有效的URL'));
        process.exit(1);
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
      
      // 创建适配器
      const adapterOptions = {
        verbose: options.verbose,
        debug: options.debug,
        timeout: parseInt(options.timeout),
        strapiConfig: config
      };

      const adapter = new CLIAdapter(adapterOptions);

      // 显示开始信息
      if (options.verbose) {
        console.log(chalk.blue('🚀 微信文章提取工具 - 重构版'));
        console.log(chalk.gray(`版本: ${packageInfo.version}`));
        console.log(chalk.gray(`URL: ${url}`));
        console.log('='.repeat(50));
        
        console.log(chalk.gray('设置:'));
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

      // 输出结果
      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        adapter.printExtractionReport(result);
        
        if (options.verbose) {
          console.log(chalk.blue(`\n⏱️  总耗时: ${endTime - startTime}ms`));
        }
      }

    } catch (error) {
      console.error(chalk.red(`❌ 提取失败: ${error.message}`));
      
      if (options.debug) {
        console.error(chalk.gray('\n调试信息:'));
        console.error(error.stack);
      }
      
      process.exit(1);
    }
  });

// 配置模版生成命令
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

// Chrome扩展备份导入命令
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
      
      console.log(chalk.blue(`\n📝 配置已保存到: ${configManager.configPath}`));
      console.log(chalk.blue('🚀 现在您可以使用 --strapi 将文章发送到配置的Strapi实例'));
      
    } catch (error) {
      console.error(chalk.red(`❌ 导入Chrome备份失败: ${error.message}`));
      process.exit(1);
    }
  });

// Chrome扩展备份导出命令
program
  .command('export-chrome-backup')
  .description('导出当前配置为Chrome扩展备份')
  .argument('<output-path>', '输出备份文件路径')
  .option('-c, --config <path>', '源配置文件路径')
  .action(async (outputPath, options) => {
    try {
      const configManager = new ConfigManager(options.config);
      await configManager.load();
      
      const result = await configManager.exportAsChromeBackup(outputPath);
      
      console.log(chalk.green('✅ Chrome扩展备份导出成功!'));
      console.log(chalk.gray(`  导出路径: ${result.path}`));
      console.log(chalk.gray(`  时间戳: ${result.timestamp}`));
      console.log(chalk.blue('\n📥 您现在可以将此备份导入到Chrome扩展中'));
      
    } catch (error) {
      console.error(chalk.red(`❌ 导出Chrome备份失败: ${error.message}`));
      process.exit(1);
    }
  });

// 测试命令
program
  .command('test')
  .description('测试共享核心模块')
  .option('-v, --verbose', '显示详细输出')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🧪 测试共享核心模块'));
      
      // 测试工具函数
      const { isValidImageUrl, generateSlug } = await import('../../shared/core/index.js');
      
      const testImage = 'https://mmbiz.qpic.cn/test.jpg';
      const testTitle = '测试文章标题 - 共享模块测试';
      
      console.log(chalk.green('✅ 工具函数测试:'));
      console.log(`  图片URL验证: ${isValidImageUrl(testImage)}`);
      console.log(`  Slug生成: ${generateSlug(testTitle)}`);
      
      // 测试提取器创建
      const { createWeChatExtractor } = await import('../../shared/core/index.js');
      const extractor = createWeChatExtractor({ 
        environment: 'node',
        verbose: options.verbose
      });
      
      console.log(chalk.green('✅ 提取器创建: 成功'));
      
      console.log(chalk.blue('\n🎉 所有测试通过！'));
      
    } catch (error) {
      console.error(chalk.red(`❌ 测试失败: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * 加载配置文件
 * @param {string} configPath - 配置文件路径
 * @returns {Promise<Object>} 配置对象
 */
async function loadConfig(configPath) {
  if (!configPath) {
    return null;
  }

  try {
    const { readFileSync } = await import('fs');
    const configContent = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    console.log(chalk.blue(`📁 已加载配置文件: ${configPath}`));
    return config;
    
  } catch (error) {
    console.error(chalk.yellow(`⚠️  配置文件加载失败: ${error.message}`));
    return null;
  }
}

// 全局错误处理
process.on('uncaughtException', (error) => {
  // 忽略JSDOM相关的错误
  if (error.message && (
    error.message.includes('PerformanceObserver') ||
    error.message.includes('window.matchMedia') ||
    error.message.includes('incorrect header check') ||
    error.message.includes('jsdom')
  )) {
    return; // 静默忽略
  }
  
  console.error(chalk.red('❌ 未捕获的异常:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  // 忽略JSDOM相关的Promise拒绝
  if (reason && typeof reason === 'object' && (
    (reason.message && reason.message.includes('jsdom')) ||
    (reason.message && reason.message.includes('window.matchMedia')) ||
    (reason.message && reason.message.includes('PerformanceObserver')) ||
    (reason.message && reason.message.includes('incorrect header check'))
  )) {
    return; // 静默忽略
  }
  
  console.error(chalk.red('❌ 未处理的Promise拒绝:'), reason);
  process.exit(1);
});

// 运行程序
program.parse();