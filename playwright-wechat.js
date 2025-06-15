import { chromium } from 'playwright';

async function openWeChatArticle(args) {
  // url - args[0]
  const url = args[0];
  
  console.log('启动 Playwright 浏览器...');
  console.log(`目标 URL: ${url}`);
  
  // 启动浏览器，设置 headless: false 以显示 UI
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100 // 添加一些延迟以便观察
  });
  
  const context = await browser.newContext({
    // 设置用户代理，模拟真实浏览器
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('正在加载页面...');
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('页面加载完成！');
    console.log('浏览器窗口已打开，您可以查看和操作页面');
    console.log('按 Ctrl+C 退出脚本并关闭浏览器');
    
    // 等待页面标题加载
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    
    // 保持浏览器打开，等待用户手动关闭或按 Ctrl+C
    await new Promise(() => {});
    
  } catch (error) {
    console.error('加载页面时出错:', error.message);
  } finally {
    // 这里不会执行，除非出现错误
    await browser.close();
  }
}

// 处理 Ctrl+C 退出
process.on('SIGINT', async () => {
  console.log('\n正在关闭浏览器...');
  process.exit(0);
});

// 运行脚本
openWeChatArticle(process.argv.slice(2)).catch(console.error);

