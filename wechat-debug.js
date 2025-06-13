const { spawn } = require('child_process');

async function testWeChatUrl() {
  const testUrl = 'https://mp.weixin.qq.com/s/8VmxdoRLI0VN-LCiuyOM3g?poc_token=HKHUS2ijjC87vQbwzjh65TgGKewBVFgWv_-qRdjY';
  
  console.log('🔍 调试微信文章内容提取');
  console.log(`测试URL: ${testUrl}`);
  console.log('='.repeat(80));
  
  try {
    // 使用CLI工具进行提取
    console.log('📋 使用CLI工具进行提取...');
    
    const child = spawn('node', ['cli/cli.js', 'extract', testUrl, '-v'], {
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      process.stderr.write(text);
    });
    
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        console.log(`\n进程结束，退出码: ${code}`);
        
        if (code === 0) {
          console.log('\n✅ 提取完成');
          resolve();
        } else {
          console.log('\n❌ 提取失败');
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
    
    // 分析结果
    console.log('\n🔍 结果分析:');
    
    if (output.includes('环境异常') || error.includes('环境异常')) {
      console.log('❌ 页面显示"环境异常"，需要验证才能访问');
    }
    
    if (output.includes('内容长度') && output.includes('0')) {
      console.log('⚠️  内容提取失败或长度为0');
    }
    
    console.log('\n💡 基于浏览器日志的分析:');
    console.log('- 页面存在环境验证机制');
    console.log('- Defuddle算法过度清理，删除了正文内容');
    console.log('- 需要优化内容提取策略');
    
  } catch (err) {
    console.error('执行失败:', err.message);
  }
}

// 执行测试
testWeChatUrl().catch(console.error); 