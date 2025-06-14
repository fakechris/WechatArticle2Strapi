#!/usr/bin/env node
import { PlaywrightAdapter } from './src/adapters/playwright-adapter.js';
import chalk from 'chalk';

const testUrl = 'https://m.jinrongbaguanv.com/details/details.html?id=128304';

console.log(chalk.blue('🧪 金融八卦女网站内容质量测试'));
console.log(chalk.gray(`📍 URL: ${testUrl}`));
console.log(chalk.gray('=' .repeat(80)));

async function runTest() {
  const adapter = new PlaywrightAdapter({
    debug: true,
    playwright: {
      browser: 'chromium',
      headless: false,  // 使用有头模式便于观察
      waitTimeout: 30000,  // 30秒等待时间
      loadImages: true     // 启用图片加载
    }
  });

  try {
    console.log(chalk.yellow('\n⏳ 第一步: 检查内容质量...'));
    const qualityReport = await adapter.checkContentQuality(testUrl);
    
    console.log(chalk.green('\n📊 质量报告总结:'));
    console.log(`📝 标题: ${qualityReport.title}`);
    console.log(`📊 文本长度: ${qualityReport.bodyTextLength} 字符`);
    console.log(`🔍 关键词匹配: ${qualityReport.hasKeywords ? '✅' : '❌'} ${qualityReport.keywordMatches.join(', ')}`);
    console.log(`🖼️  图片情况: 总计 ${qualityReport.imageCount}，可见 ${qualityReport.visibleImageCount}`);
    
    if (qualityReport.contentAreas.length > 0) {
      console.log(chalk.cyan('\n🎯 最佳内容区域:'));
      const bestArea = qualityReport.contentAreas[0];
      console.log(`   选择器: ${bestArea.selector}`);
      console.log(`   文本长度: ${bestArea.textLength} 字符`);
      console.log(`   图片数量: ${bestArea.hasImages} 张`);
    }

    console.log(chalk.yellow('\n⏳ 第二步: 执行完整提取测试...'));
    const content = await adapter.fetchHtmlContent(testUrl);
    
    console.log(chalk.green('\n🎯 提取结果:'));
    console.log(`📄 HTML 长度: ${content.length} 字符`);
    
    // 精确的内容分析
    console.log(chalk.cyan('\n🔬 详细内容分析:'));
    
    // 第一步：基础清理
    let cleanText = content
      // 移除script和style标签及其内容
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // 移除HTML注释
      .replace(/<!--[\s\S]*?-->/g, '')
      // 移除所有HTML标签
      .replace(/<[^>]*>/g, ' ')
      // 解码HTML实体
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, ' ')
      .replace(/&\w+;/g, ' ')
      // 清理多余空白
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`📄 原始HTML长度: ${content.length} 字符`);
    console.log(`🧹 清理后文本长度: ${cleanText.length} 字符`);
    
    // 分析文本质量
    const chineseChars = (cleanText.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (cleanText.match(/[a-zA-Z]+/g) || []).length;
    const numbers = (cleanText.match(/\d+/g) || []).length;
    const specialChars = cleanText.length - chineseChars - (cleanText.match(/[a-zA-Z\d\s]/g) || []).length;
    
    console.log(`🈶 中文字符: ${chineseChars} 个`);
    console.log(`🔤 英文单词: ${englishWords} 个`);
    console.log(`🔢 数字: ${numbers} 个`);
    console.log(`⚡ 特殊字符: ${specialChars} 个`);
    
    // 计算文本质量指标
    const textQualityRatio = chineseChars / Math.max(cleanText.length, 1);
    const isReasonableText = textQualityRatio > 0.3 && cleanText.length > 500;
    
    console.log(`📊 中文字符占比: ${(textQualityRatio * 100).toFixed(1)}%`);
    console.log(`✅ 文本合理性: ${isReasonableText ? '正常' : '异常'}`);
    
    // 关键词检查
    const targetKeywords = ['降准降息', '潘功胜', '三大类政策', '十项措施'];
    const foundKeywords = targetKeywords.filter(keyword => cleanText.includes(keyword));
    const hasTargetKeywords = foundKeywords.length > 0;
    
    console.log(`🎯 目标关键词: ${hasTargetKeywords ? '✅' : '❌'} 找到 ${foundKeywords.length}/${targetKeywords.length} 个`);
    if (foundKeywords.length > 0) {
      console.log(`   匹配关键词: ${foundKeywords.join(', ')}`);
    }
    
    // 内容预览
    const contentPreview = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
    console.log(`📖 内容预览: ${contentPreview}`);
    
    // 分析改进情况
    console.log(chalk.blue('\n📈 改进分析:'));
    const isGoodQuality = qualityReport.bodyTextLength > 2000 && qualityReport.hasKeywords;
    const hasGoodImages = qualityReport.visibleImageCount > 0;
    const hasGoodExtraction = isReasonableText && hasTargetKeywords && chineseChars > 1000;
    
    console.log(`✅ 内容质量: ${isGoodQuality ? '优秀' : '需要改进'}`);
    console.log(`🖼️  图片检测: ${hasGoodImages ? '正常' : '待优化'}`);
    console.log(`🎯 提取效果: ${hasGoodExtraction ? '优秀' : '需要改进'}`);
    
    // 对比分析
    console.log(chalk.magenta('\n🔄 对比分析:'));
    console.log(`📊 页面检测文本 vs 实际提取: ${qualityReport.bodyTextLength} → ${cleanText.length} 字符`);
    console.log(`🈶 页面检测 vs 实际中文字符: 未知 → ${chineseChars} 个`);
    console.log(`🖼️  页面图片 vs 可见图片: ${qualityReport.imageCount} → ${qualityReport.visibleImageCount} 张`);
    console.log(`📈 提取效率: ${((cleanText.length / Math.max(qualityReport.bodyTextLength, 1)) * 100).toFixed(1)}%`);
    
    if (!isGoodQuality || !hasGoodImages || !hasGoodExtraction) {
      console.log(chalk.yellow('\n💡 优化建议:'));
      if (!isGoodQuality) {
        console.log('• 页面内容加载不完整，尝试增加等待时间到 45-60 秒');
      }
      if (!hasGoodImages) {
        console.log('• 图片未完全加载，启用 --load-images 并增加等待时间');
      }
      if (!hasGoodExtraction) {
        console.log('• 内容提取不理想，可能需要优化选择器或等待策略');
      }
      console.log('• 检查特定网站的 JavaScript 加载机制');
      console.log('• 考虑等待特定的 DOM 元素出现');
    } else {
      console.log(chalk.green('\n🎉 测试通过！内容提取质量良好'));
    }

  } catch (error) {
    console.error(chalk.red(`❌ 测试失败: ${error.message}`));
    console.error(error.stack);
  } finally {
    // 清理资源
    try {
      if (adapter.browser) {
        await adapter.browser.close();
      }
    } catch (cleanupError) {
      console.error(chalk.yellow(`⚠️  清理资源时出现警告: ${cleanupError.message}`));
    }
  }
}

runTest().catch(console.error); 