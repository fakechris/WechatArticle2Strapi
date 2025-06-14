# Playwright 自动化集成技术文档

## 📋 概述

v0.5.2版本中新增了Playwright自动化支持，为WechatArticle2Strapi项目带来了强大的浏览器自动化能力。Playwright是一个现代化的浏览器自动化库，能够处理复杂的页面交互和动态内容。

## 🎯 主要功能

### 1. 多浏览器支持
- **Chromium**: 默认引擎，与Chrome Extension协同工作
- **Firefox**: 支持火狐浏览器自动化
- **WebKit**: 支持Safari浏览器引擎

### 2. 动态内容处理
- **JavaScript渲染**: 等待JS执行完成后提取内容
- **单页应用(SPA)**: 支持React、Vue等框架的页面
- **Ajax加载**: 处理异步加载的内容
- **懒加载**: 自动滚动触发懒加载内容

### 3. 智能等待机制
- **页面加载**: 等待DOMContentLoaded和load事件
- **元素出现**: 等待特定元素在DOM中出现
- **网络空闲**: 等待网络请求完成
- **自定义条件**: 支持自定义等待条件

### 4. 复杂交互支持
- **点击操作**: 模拟鼠标点击
- **表单填写**: 自动填写登录表单
- **滚动操作**: 模拟页面滚动
- **键盘输入**: 模拟键盘按键

## 🏗️ 架构集成

### CLI工具集成
```javascript
// cli/src/playwright-extractor.js
import { chromium, firefox, webkit } from 'playwright';

class PlaywrightExtractor {
  async extractWithBrowser(url, options = {}) {
    const browser = await chromium.launch({
      headless: options.headless ?? true
    });
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // 等待内容加载
    await this.waitForContent(page, options);
    
    // 提取内容
    const content = await this.extractContent(page);
    
    await browser.close();
    return content;
  }
}
```

### 共享逻辑扩展
```javascript
// shared/core/playwright-utils.js
export const PlaywrightUtils = {
  // 智能等待函数
  async waitForContent(page, selectors = []) {
    // 等待主要内容选择器
    for (const selector of selectors) {
      await page.waitForSelector(selector, { timeout: 10000 });
    }
  },
  
  // 滚动加载更多内容
  async scrollAndLoad(page) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
  }
};
```

## ⚙️ 配置选项

### 基础配置
```json
{
  "playwright": {
    "enabled": true,
    "browser": "chromium",
    "headless": true,
    "timeout": 30000,
    "waitForSelector": ".article-content",
    "scrollToLoad": true
  }
}
```

### 高级配置
```json
{
  "playwright": {
    "launchOptions": {
      "args": ["--no-sandbox", "--disable-setuid-sandbox"],
      "executablePath": "/path/to/chrome"
    },
    "contextOptions": {
      "viewport": { "width": 1920, "height": 1080 },
      "userAgent": "Mozilla/5.0..."
    },
    "pageOptions": {
      "waitUntil": "networkidle",
      "timeout": 60000
    }
  }
}
```

## 🚀 使用场景

### 1. 单页应用(SPA)
```javascript
// 处理React/Vue等SPA应用
const result = await playwright.extract(url, {
  waitForSelector: '.app-loaded',
  scrollToLoad: true,
  waitForNetworkIdle: true
});
```

### 2. 需要登录的网站
```javascript
// 自动登录后提取内容
await page.fill('#username', config.username);
await page.fill('#password', config.password);
await page.click('#login-btn');
await page.waitForSelector('.user-dashboard');
```

### 3. 懒加载内容
```javascript
// 滚动加载所有内容
await page.evaluate(() => {
  return new Promise((resolve) => {
    let totalHeight = 0;
    const distance = 100;
    const timer = setInterval(() => {
      window.scrollBy(0, distance);
      totalHeight += distance;
      if (totalHeight >= document.body.scrollHeight) {
        clearInterval(timer);
        resolve();
      }
    }, 100);
  });
});
```

### 4. 验证码处理
```javascript
// 等待用户手动处理验证码
if (await page.locator('.captcha').isVisible()) {
  console.log('请手动完成验证码验证...');
  await page.waitForSelector('.captcha', { state: 'hidden' });
}
```

## 📊 性能优化

### 1. 资源拦截
```javascript
// 拦截图片和样式文件提升速度
await page.route('**/*.{png,jpg,jpeg,gif,css}', route => route.abort());
```

### 2. 并发处理
```javascript
// 并发处理多个URL
const results = await Promise.all(
  urls.map(url => playwright.extract(url, options))
);
```

### 3. 浏览器复用
```javascript
// 复用浏览器实例
const browser = await chromium.launch();
const contexts = await Promise.all([
  browser.newContext(),
  browser.newContext(),
  browser.newContext()
]);
```

## 🐛 错误处理

### 常见错误及解决方案

#### 1. 超时错误
```javascript
try {
  await page.waitForSelector('.content', { timeout: 30000 });
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.log('页面加载超时，尝试提取现有内容');
    // 降级处理
  }
}
```

#### 2. 元素不存在
```javascript
const element = await page.locator('.article').first();
if (await element.count() === 0) {
  throw new Error('未找到文章内容');
}
```

#### 3. 网络错误
```javascript
page.on('response', response => {
  if (response.status() >= 400) {
    console.warn(`HTTP ${response.status()}: ${response.url()}`);
  }
});
```

## 📈 调试功能

### 1. 截图调试
```javascript
// 保存页面截图
await page.screenshot({ 
  path: `debug-${Date.now()}.png`,
  fullPage: true 
});
```

### 2. 视频录制
```javascript
const context = await browser.newContext({
  recordVideo: {
    dir: './temp/debug/videos/',
    size: { width: 1920, height: 1080 }
  }
});
```

### 3. 网络监控
```javascript
page.on('request', request => {
  console.log('→', request.method(), request.url());
});

page.on('response', response => {
  console.log('←', response.status(), response.url());
});
```

## 🔧 CLI使用示例

### 基础用法
```bash
# 使用Playwright提取文章
article-extractor --url "https://example.com/article" --playwright

# 指定浏览器
article-extractor --url "https://example.com" --playwright --browser firefox

# 非无头模式（显示浏览器）
article-extractor --url "https://example.com" --playwright --headless false
```

### 批量处理
```bash
# 从CSV批量处理（使用Playwright）
article-extractor --csv articles.csv --playwright --concurrent 3
```

### 配置文件
```json
// .articlerc.json
{
  "playwright": {
    "enabled": true,
    "browser": "chromium",
    "headless": true,
    "defaultTimeout": 30000,
    "scrollToLoad": true,
    "waitForNetworkIdle": true
  }
}
```

## 📋 最佳实践

### 1. 选择器策略
- 优先使用稳定的CSS选择器
- 避免依赖动态生成的class名
- 使用多个备选选择器

### 2. 等待策略
- 根据页面特点选择合适的等待条件
- 设置合理的超时时间
- 使用智能降级处理

### 3. 资源管理
- 及时关闭浏览器和页面
- 限制并发数量避免资源耗尽
- 监控内存使用情况

### 4. 错误恢复
- 实现多层次的错误处理
- 提供降级的内容提取方案
- 记录详细的错误日志

## 🔄 版本兼容性

- **Node.js**: 要求16.0+
- **Playwright**: 支持1.40.0+
- **浏览器**: 自动下载对应版本
- **系统**: Windows, macOS, Linux

## 📚 参考资源

- [Playwright官方文档](https://playwright.dev/)
- [Playwright API参考](https://playwright.dev/docs/api/class-playwright)
- [浏览器自动化最佳实践](https://playwright.dev/docs/best-practices)

---

*此文档更新于：2024年12月19日 | 版本：v0.5.2* 