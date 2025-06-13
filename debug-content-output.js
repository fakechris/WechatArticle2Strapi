#!/usr/bin/env node

/**
 * 调试脚本：检查微信文章内容提取结果
 * 用于诊断内容提取问题
 */

import { CLIAdapter } from './cli/src/adapters/cli-adapter.js';
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';

const testUrl = 'https://mp.weixin.qq.com/s/8VmxdoRLI0VN-LCiuyOM3g';

console.log(chalk.blue('🔍 开始调试内容提取...'));
console.log(chalk.gray(`URL: ${testUrl}`));

try {
  // 创建适配器
  const adapter = new CLIAdapter({
    verbose: true,
    debug: true
  });

  // 提取文章
  const result = await adapter.extractFromUrl(testUrl);
  const article = result.article;

  console.log(chalk.green('\n✅ 提取完成，开始分析内容...'));

  // 分析内容
  console.log(chalk.blue('\n📊 内容分析:'));
  console.log(`标题: ${article.title}`);
  console.log(`作者: ${article.author}`);
  console.log(`发布时间: ${article.publishTime}`);
  console.log(`内容长度: ${article.content?.length || 0} 字符`);
  console.log(`图片数量: ${article.images?.length || 0} 张`);
  console.log(`提取方法: ${article.extractionMethod}`);

  // 检查内容开头
  if (article.content) {
    const contentPreview = article.content.substring(0, 500);
    console.log(chalk.yellow('\n📝 内容预览 (前500字符):'));
    console.log('---');
    console.log(contentPreview);
    console.log('---');

    // 检查是否包含实际文本内容
    const textContent = article.content.replace(/<[^>]*>/g, '').trim();
    const textPreview = textContent.substring(0, 200);
    console.log(chalk.yellow('\n📄 纯文本预览 (前200字符):'));
    console.log('---');
    console.log(textPreview);
    console.log('---');

    // 分析HTML结构
    const tagMatches = article.content.match(/<(\w+)[^>]*>/g) || [];
    const uniqueTags = [...new Set(tagMatches.map(tag => tag.match(/<(\w+)/)[1]))];
    console.log(chalk.cyan('\n🏷️  HTML标签分析:'));
    console.log(`总标签数: ${tagMatches.length}`);
    console.log(`唯一标签: ${uniqueTags.join(', ')}`);

    // 检查图片标签
    const imgTags = article.content.match(/<img[^>]*>/g) || [];
    console.log(chalk.cyan('\n🖼️  图片标签分析:'));
    console.log(`图片标签数: ${imgTags.length}`);
    if (imgTags.length > 0) {
      console.log('前3个图片标签:');
      imgTags.slice(0, 3).forEach((img, index) => {
        console.log(`  ${index + 1}: ${img.substring(0, 100)}...`);
      });
    }
  } else {
    console.log(chalk.red('❌ 没有提取到内容!'));
  }

  // 检查图片数据
  if (article.images && article.images.length > 0) {
    console.log(chalk.cyan('\n📷 图片数据分析:'));
    article.images.slice(0, 3).forEach((img, index) => {
      console.log(`  图片 ${index + 1}:`);
      console.log(`    URL: ${img.src?.substring(0, 80)}...`);
      console.log(`    Alt: ${img.alt || '(无)'}`);
    });
  }

  // 保存完整结果到文件
  const outputData = {
    extractionInfo: {
      url: testUrl,
      timestamp: new Date().toISOString(),
      title: article.title,
      author: article.author,
      publishTime: article.publishTime,
      contentLength: article.content?.length || 0,
      imagesCount: article.images?.length || 0,
      extractionMethod: article.extractionMethod
    },
    content: article.content,
    images: article.images,
    fullResult: result
  };

  writeFileSync('debug-extraction-result.json', JSON.stringify(outputData, null, 2));
  console.log(chalk.green('\n💾 完整结果已保存到: debug-extraction-result.json'));

  // 保存纯HTML内容
  if (article.content) {
    writeFileSync('debug-content.html', article.content);
    console.log(chalk.green('📄 HTML内容已保存到: debug-content.html'));
  }

  // 诊断结论
  console.log(chalk.blue('\n🔍 诊断结论:'));
  
  if (!article.content || article.content.length < 100) {
    console.log(chalk.red('❌ 内容提取失败或内容过少'));
    console.log(chalk.yellow('   可能原因:'));
    console.log(chalk.yellow('   1. 微信页面结构变化'));
    console.log(chalk.yellow('   2. 选择器失效'));
    console.log(chalk.yellow('   3. 页面动态加载内容'));
    console.log(chalk.yellow('   4. 网络或请求问题'));
  } else if (article.content.replace(/<[^>]*>/g, '').trim().length < 100) {
    console.log(chalk.yellow('⚠️  提取到HTML但纯文本内容少'));
    console.log(chalk.yellow('   可能原因:'));
    console.log(chalk.yellow('   1. 提取了错误的HTML区域'));
    console.log(chalk.yellow('   2. 内容在其他元素中'));
    console.log(chalk.yellow('   3. 清理规则过于激进'));
  } else {
    console.log(chalk.green('✅ 内容提取看起来正常'));
    console.log(chalk.blue('   如果发送到Strapi有问题，可能是:'));
    console.log(chalk.blue('   1. Strapi字段映射配置'));
    console.log(chalk.blue('   2. HTML内容格式化'));
    console.log(chalk.blue('   3. 内容长度限制'));
  }

} catch (error) {
  console.error(chalk.red('❌ 调试失败:'), error.message);
  console.error(chalk.gray(error.stack));
} 