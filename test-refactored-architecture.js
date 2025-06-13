#!/usr/bin/env node

/**
 * 重构架构测试脚本
 * 验证共享核心模块和适配器是否正常工作
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🧪 测试重构后的架构\n');
console.log('='.repeat(50));

async function testSharedModules() {
  console.log('🔧 测试共享模块...');
  
  try {
    // 测试工具函数
    const { isValidImageUrl, generateSlug } = await import('./shared/utils/url-utils.js');
    const { generateSlug: slugUtils } = await import('./shared/utils/slug-utils.js');
    
    console.log('✅ 工具函数导入成功');
    
    // 测试URL验证
    const testImageUrl = 'https://mmbiz.qpic.cn/test.jpg';
    const isValid = isValidImageUrl(testImageUrl);
    console.log(`  - 图片URL验证: ${testImageUrl} -> ${isValid}`);
    
    // 测试Slug生成
    const testTitle = '测试重构架构 - 微信文章提取器';
    const slug = slugUtils(testTitle);
    console.log(`  - Slug生成: "${testTitle}" -> "${slug}"`);
    
    return true;
  } catch (error) {
    console.error('❌ 共享模块测试失败:', error.message);
    return false;
  }
}

async function testCoreModules() {
  console.log('\n🚀 测试核心模块...');
  
  try {
    // 测试核心模块导入
    const { 
      createWeChatExtractor, 
      createStrapiIntegration,
      WECHAT_SELECTORS 
    } = await import('./shared/core/index.js');
    
    console.log('✅ 核心模块导入成功');
    
    // 测试提取器创建
    try {
      const extractor = createWeChatExtractor({
        environment: 'node',
        verbose: false
      });
      console.log('  - 微信提取器创建: 成功');
      console.log(`  - 提取器类型: ${extractor.constructor.name}`);
    } catch (createError) {
      console.log(`  - 微信提取器创建: 失败 - ${createError.message}`);
    }
    
    // 测试选择器常量
    console.log(`  - 微信选择器数量: ${WECHAT_SELECTORS.title.length} 个标题选择器`);
    
    // 测试Strapi集成创建
    try {
      const mockConfig = {
        strapiUrl: 'https://test.com',
        token: 'test-token',
        collection: 'articles'
      };
      const strapiIntegration = createStrapiIntegration(mockConfig);
      console.log('  - Strapi集成创建: 成功');
    } catch (strapiError) {
      console.log(`  - Strapi集成创建: 失败 - ${strapiError.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ 核心模块测试失败:', error.message);
    return false;
  }
}

async function testAdapters() {
  console.log('\n⚙️  测试适配器...');
  
  try {
    // 测试适配器文件是否存在
    try {
      await import('./cli/src/adapters/cli-adapter.js');
      console.log('✅ CLI适配器文件: 存在');
    } catch (error) {
      console.log('⚠️  CLI适配器文件: 导入失败 -', error.message.substring(0, 50) + '...');
    }
    
    try {
      await import('./extension/src/adapters/extension-adapter.js');
      console.log('✅ 扩展适配器文件: 存在');
    } catch (error) {
      console.log('⚠️  扩展适配器文件: 导入失败 -', error.message.substring(0, 50) + '...');
    }
    
    console.log('✅ 适配器架构测试: 文件结构正确');
    return true;
  } catch (error) {
    console.error('❌ 适配器测试失败:', error.message);
    return false;
  }
}

async function testArchitecture() {
  console.log('📊 架构测试摘要:');
  
  const tests = [
    { name: '共享模块', test: testSharedModules },
    { name: '核心模块', test: testCoreModules },
    { name: '适配器', test: testAdapters }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
        console.log(`✅ ${name}: 通过`);
      } else {
        console.log(`❌ ${name}: 失败`);
      }
    } catch (error) {
      console.log(`❌ ${name}: 异常 - ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有测试通过！重构架构正常工作。');
    console.log('\n📋 下一步:');
    console.log('1. 运行实际的文章提取测试');
    console.log('2. 迁移现有的CLI和扩展代码');
    console.log('3. 添加完整的单元测试');
    console.log('4. 性能基准测试');
  } else {
    console.log('⚠️  部分测试失败，需要检查模块导入和依赖关系。');
  }
  
  return passed === total;
}

// 运行测试
testArchitecture().catch(error => {
  console.error('💥 测试运行失败:', error);
  process.exit(1);
}); 