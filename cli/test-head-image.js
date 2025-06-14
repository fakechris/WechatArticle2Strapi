#!/usr/bin/env node

/**
 * 测试CLI头图尺寸检查功能
 */

const ArticleExtractor = require('./src/extractor.js');
const chalk = require('chalk');

// 模拟一个带有多张图片的文章对象
const mockArticle = {
  title: '测试文章 - 头图尺寸检查',
  content: '这是一个测试文章，用于验证头图尺寸检查功能。',
  images: [
    {
      src: 'https://mmbiz.qpic.cn/mmbiz_jpg/small_image_100x100.jpg',
      alt: '小图片 100x100'
    },
    {
      src: 'https://mmbiz.qpic.cn/mmbiz_jpg/medium_image_300x250.jpg', 
      alt: '中等图片 300x250'
    },
    {
      src: 'https://mmbiz.qpic.cn/mmbiz_jpg/large_image_800x600.jpg',
      alt: '大图片 800x600'
    }
  ]
};

async function testHeadImageSelection() {
  console.log(chalk.blue('\n🧪 开始测试CLI头图尺寸检查功能...\n'));
  
  // 创建ArticleExtractor实例
  const extractor = new ArticleExtractor({
    verbose: true,
    debug: true,
    config: {
      advancedSettings: {
        headImgIndex: 0,  // 指定第一张图片（小图片）
        uploadHeadImg: true
      }
    }
  });

  try {
    console.log(chalk.yellow('原始文章数据:'));
    console.log(`标题: ${mockArticle.title}`);
    console.log(`图片数量: ${mockArticle.images.length}`);
    
    mockArticle.images.forEach((image, index) => {
      console.log(`  图片 ${index + 1}: ${image.src} (${image.alt})`);
    });
    
    console.log(chalk.blue('\n🔍 测试头图尺寸检查逻辑...\n'));
    
    // 测试各个函数
    console.log(chalk.cyan('1. 测试获取图片尺寸:'));
    for (let i = 0; i < mockArticle.images.length; i++) {
      const image = mockArticle.images[i];
      console.log(`检查图片 ${i + 1}: ${image.src}`);
      
      try {
        const dimensions = await extractor.getImageDimensions(image.src);
        console.log(`  结果: ${dimensions.width}x${dimensions.height}`);
      } catch (error) {
        console.log(`  错误: ${error.message}`);
      }
    }
    
    console.log(chalk.cyan('\n2. 测试头图验证:'));
    for (let i = 0; i < mockArticle.images.length; i++) {
      const image = mockArticle.images[i];
      const validationResult = await extractor.isValidHeadImage(image.src, 200, 200);
      console.log(`图片 ${i + 1}: ${validationResult.isValid ? '✅ 符合' : '❌ 不符合'} 尺寸要求`);
    }
    
    console.log(chalk.cyan('\n3. 测试查找符合要求的头图:'));
    const validHeadImage = await extractor.findValidHeadImage(mockArticle.images, 200, 200);
    
    if (validHeadImage) {
      console.log(chalk.green(`找到符合要求的头图: 索引 ${validHeadImage.index}`));
      console.log(`  URL: ${validHeadImage.image.src}`);
      console.log(`  尺寸: ${validHeadImage.dimensions.width}x${validHeadImage.dimensions.height}`);
    } else {
      console.log(chalk.red('未找到符合要求的头图'));
    }
    
    console.log(chalk.blue('\n✅ 测试完成！'));
    
  } catch (error) {
    console.error(chalk.red(`❌ 测试失败: ${error.message}`));
    console.error(error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testHeadImageSelection().catch(console.error);
}

module.exports = { testHeadImageSelection }; 