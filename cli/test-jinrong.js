#!/usr/bin/env node

/**
 * 金融八卦女网站测试脚本
 * 用于测试动态内容提取修复效果
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

const testUrl = 'https://m.jinrongbaguanv.com/details/details.html?id=128304';

console.log(chalk.blue('🧪 金融八卦女网站动态内容提取测试'));
console.log(chalk.gray('='.repeat(50)));
console.log(chalk.yellow(`测试URL: ${testUrl}`));

async function runCommand(description, command) {
  console.log(chalk.blue(`\n📋 ${description}`));
  console.log(chalk.gray(`命令: ${command}`));
  
  try {
    const startTime = Date.now();
    const output = execSync(command, { 
      encoding: 'utf8',
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    const endTime = Date.now();
    
    console.log(chalk.green(`✅ 成功 (${endTime - startTime}ms)`));
    
    // 分析输出
    if (output.includes('内容长度:')) {
      const contentMatch = output.match(/内容长度: (\d+) 字符/);
      const wordsMatch = output.match(/字数统计: (\d+) 字/);
      const imagesMatch = output.match(/图片数量: (\d+) 张/);
      
      if (contentMatch) {
        const contentLength = parseInt(contentMatch[1]);
        console.log(chalk.cyan(`📊 内容长度: ${contentLength} 字符`));
        
        if (contentLength > 10000) {
          console.log(chalk.green('✅ 内容提取正常'));
        } else {
          console.log(chalk.yellow('⚠️ 内容较少，可能有问题'));
        }
      }
      
      if (wordsMatch) {
        const words = parseInt(wordsMatch[1]);
        console.log(chalk.cyan(`📝 字数: ${words} 字`));
      }
      
      if (imagesMatch) {
        const images = parseInt(imagesMatch[1]);
        console.log(chalk.cyan(`🖼️ 图片: ${images} 张`));
      }
    }
    
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ 失败: ${error.message}`));
    return false;
  }
}

async function main() {
  console.log(chalk.blue('\n🔍 1. 页面结构分析'));
  await runCommand(
    '分析页面结构',
    `./cli/bin/cli_v2.js debug-structure "${testUrl}"`
  );

  console.log(chalk.blue('\n⚙️ 2. 不同等待策略测试'));
  
  const testConfigs = [
    {
      name: '默认策略',
      args: '--verbose'
    },
    {
      name: '延长等待时间',
      args: '--verbose --wait-timeout 45000'
    },
    {
      name: '加载图片资源',
      args: '--verbose --load-images --wait-timeout 30000'
    },
    {
      name: '有头模式 (调试)',
      args: '--verbose --no-headless --wait-timeout 20000'
    }
  ];

  for (const config of testConfigs) {
    console.log(chalk.blue(`\n📋 ${config.name}`));
    
    const success = await runCommand(
      config.name,
      `./cli/bin/cli_v2.js "${testUrl}" ${config.args} --output json`
    );
    
    if (!success && config.name !== '有头模式 (调试)') {
      console.log(chalk.red('❌ 测试失败，跳过后续测试'));
      break;
    }
    
    // 避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(chalk.blue('\n🆚 3. v1 vs v2 对比测试'));
  
  console.log(chalk.yellow('\n📊 v1 (axios + JSDOM) 结果:'));
  await runCommand(
    'v1 版本测试',
    `./cli/bin/cli.js "${testUrl}" --verbose --output json`
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(chalk.yellow('\n📊 v2 (Playwright) 结果:'));
  await runCommand(
    'v2 版本测试',
    `./cli/bin/cli_v2.js "${testUrl}" --verbose --output json`
  );

  console.log(chalk.blue('\n📈 4. 性能测试'));
  
  const performanceTests = [
    {
      name: 'v2 快速模式',
      command: `./cli/bin/cli_v2.js "${testUrl}" --wait-timeout 10000 --headless --output json`
    },
    {
      name: 'v2 完整模式',
      command: `./cli/bin/cli_v2.js "${testUrl}" --load-images --wait-timeout 30000 --verbose --output json`
    }
  ];

  for (const test of performanceTests) {
    await runCommand(test.name, test.command);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(chalk.green('\n🎉 测试完成！'));
  console.log(chalk.blue('\n📝 测试总结:'));
  console.log(chalk.gray('1. 检查页面结构分析结果，确认内容区域'));
  console.log(chalk.gray('2. 比较不同等待策略的效果'));
  console.log(chalk.gray('3. 对比v1和v2的提取结果'));
  console.log(chalk.gray('4. 根据结果调整等待策略和选择器'));

  console.log(chalk.yellow('\n💡 优化建议:'));
  console.log(chalk.gray('• 如果内容长度过少，尝试增加等待时间'));
  console.log(chalk.gray('• 如果图片数量为0，检查页面是否需要滚动加载'));
  console.log(chalk.gray('• 使用有头模式观察页面实际加载情况'));
  console.log(chalk.gray('• 根据页面结构分析结果优化选择器'));
}

main().catch(error => {
  console.error(chalk.red('❌ 测试脚本失败:'), error.message);
  process.exit(1);
}); 