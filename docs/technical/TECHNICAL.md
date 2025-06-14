# WechatArticle2Strapi 技术实现文档

## 1. 技术架构概览

### 1.1 整体架构设计

```
微信文章页面 → Content Script → Background Script → Strapi CMS
      ↓              ↓               ↓              ↓
   DOM解析     →   消息通信    →    API调用    →   数据存储
      ↓              ↓               ↓              ↓
   图片提取     →   数据处理    →    图片上传    →   文章创建
```

### 1.2 核心组件关系

| 组件 | 职责 | 通信方式 |
|------|------|----------|
| Content Script | 内容提取、图片下载 | chrome.runtime.sendMessage |
| Background Script | API调用、数据处理 | chrome.runtime.onMessage |
| Popup | 用户交互界面 | chrome.tabs.sendMessage |
| Options | 配置管理 | chrome.storage.sync |

## 2. Content Script 实现详解

### 2.1 文章内容提取策略

#### 2.1.1 多层选择器策略
```javascript
// 标题提取 - 多个备用选择器
const titleSelectors = [
    '#activity-name',
    'h2.rich_media_title', 
    '.rich_media_title'
];

// 作者提取 - 兼容不同页面结构
const authorSelectors = [
    '.rich_media_meta_text',
    '#meta_content .rich_media_meta_nickname',
    '.account_nickname_inner'
];
```

#### 2.1.2 图片处理机制
```javascript
function extractImages(contentEl) {
    const images = [];
    const imgElements = contentEl.querySelectorAll('img');
    
    imgElements.forEach((img, index) => {
        // 过滤有效图片
        if (img.src && 
            !img.src.startsWith('data:') && 
            !img.src.includes('loading') &&
            img.width > 50 && img.height > 50) {
            
            images.push({
                src: img.src,
                alt: img.alt || '',
                index: index,
                dimensions: {
                    width: img.naturalWidth || img.width,
                    height: img.naturalHeight || img.height
                }
            });
        }
    });
    
    return images;
}
```

### 2.2 图片下载实现
```javascript
async function downloadImage(imageUrl) {
    try {
        // 设置请求头绕过防盗链
        const response = await fetch(imageUrl, {
            headers: {
                'Referer': 'https://mp.weixin.qq.com/',
                'User-Agent': navigator.userAgent
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // 验证图片类型
        if (!blob.type.startsWith('image/')) {
            throw new Error('Invalid image type');
        }
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        
    } catch (error) {
        console.error('Image download failed:', error);
        return null;
    }
}
```

## 3. Background Script 架构设计

### 3.1 服务工作器模式
采用Chrome Extension Manifest V3的Service Worker模式，实现事件驱动的后台处理。

### 3.2 图片上传管道

#### 3.2.1 上传队列管理
```javascript
class ImageUploadQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = 3;
    }
    
    async processQueue() {
        if (this.processing) return;
        this.processing = true;
        
        const promises = [];
        const batch = this.queue.splice(0, this.maxConcurrent);
        
        for (const item of batch) {
            promises.push(this.uploadSingleImage(item));
        }
        
        await Promise.allSettled(promises);
        
        if (this.queue.length > 0) {
            await this.processQueue();
        } else {
            this.processing = false;
        }
    }
}
```

#### 3.2.2 重试机制
```javascript
async function uploadWithRetry(uploadFn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await uploadFn();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            
            const delay = Math.pow(2, attempt) * 1000; // 指数退避
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
```

### 3.3 Strapi API 集成

#### 3.3.1 API 客户端封装
```javascript
class StrapiClient {
    constructor(config) {
        this.baseURL = config.strapiUrl;
        this.token = config.token;
        this.collection = config.collection;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                ...options.headers
            },
            ...options
        };
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new StrapiError(response.status, errorData);
        }
        
        return response.json();
    }
    
    async uploadMedia(file, filename) {
        const formData = new FormData();
        formData.append('files', file, filename);
        
        return this.request('/api/upload', {
            method: 'POST',
            body: formData
        });
    }
    
    async createArticle(data) {
        return this.request(`/api/${this.collection}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data })
        });
    }
}
```

#### 3.3.2 错误处理策略
```javascript
class StrapiError extends Error {
    constructor(status, data) {
        super(`Strapi API Error: ${status}`);
        this.status = status;
        this.data = data;
        this.name = 'StrapiError';
    }
    
    getUserMessage() {
        switch (this.status) {
            case 401:
                return 'API Token无效，请检查配置';
            case 403:
                return '权限不足，请检查Token权限';
            case 404:
                return '集合不存在，请检查Collection名称';
            case 413:
                return '文件过大，请压缩图片后重试';
            case 429:
                return '请求过于频繁，请稍后重试';
            default:
                return '网络错误，请检查连接';
        }
    }
}
```

## 4. 用户界面技术实现

### 4.1 Popup 组件化设计

#### 4.1.1 状态管理
```javascript
class PopupState {
    constructor() {
        this.isLoading = false;
        this.currentArticle = null;
        this.config = null;
        this.error = null;
    }
    
    setState(newState) {
        Object.assign(this, newState);
        this.render();
    }
    
    render() {
        this.updateButtons();
        this.updateStatus();
        this.updatePreview();
    }
}
```

#### 4.1.2 组件生命周期
```javascript
class PopupComponent {
    constructor() {
        this.state = new PopupState();
        this.bindEvents();
        this.init();
    }
    
    async init() {
        await this.loadConfig();
        this.validateEnvironment();
    }
    
    async loadConfig() {
        const config = await chrome.storage.sync.get([
            'strapiUrl', 'token', 'collection'
        ]);
        this.state.setState({ config });
    }
    
    validateEnvironment() {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            const isValidPage = tabs[0].url.includes('mp.weixin.qq.com');
            if (!isValidPage) {
                this.state.setState({
                    error: 'Please open a WeChat article page'
                });
            }
        });
    }
}
```

### 4.2 响应式设计实现

#### 4.2.1 CSS 变量系统
```css
:root {
    --primary-color: #007bff;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --warning-color: #ffc107;
    
    --border-radius: 6px;
    --box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    --transition: all 0.2s ease;
}
```

#### 4.2.2 组件样式模块化
```css
.btn {
    padding: 10px 12px;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: var(--transition);
    font-weight: 500;
}

.btn--primary {
    background: var(--primary-color);
    color: white;
}

.btn--primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--primary-color) 85%, black);
}
```

## 5. 数据流程和状态管理

### 5.1 数据流向图

```
用户操作 → Popup → Background → Strapi API
    ↓         ↓         ↓           ↓
  UI更新 ← 状态同步 ← 结果处理 ← 响应数据
```

### 5.2 消息通信协议

#### 5.2.1 消息类型定义
```javascript
const MessageTypes = {
    EXTRACT_ARTICLE: 'extract',
    DOWNLOAD_IMAGE: 'downloadImage',
    SEND_TO_STRAPI: 'sendToStrapi',
    CONFIG_UPDATE: 'configUpdate'
};

const MessageResponse = {
    SUCCESS: 'success',
    ERROR: 'error',
    PROGRESS: 'progress'
};
```

#### 5.2.2 消息格式规范
```javascript
// 提取文章消息
{
    type: 'extract',
    timestamp: Date.now()
}

// 发送到Strapi消息
{
    type: 'sendToStrapi',
    article: {
        title: string,
        content: string,
        author: string,
        // ...其他字段
    },
    options: {
        processImages: boolean,
        validateContent: boolean
    }
}

// 响应消息格式
{
    success: boolean,
    data?: any,
    error?: string,
    progress?: number
}
```

## 6. 性能优化策略

### 6.1 图片处理优化

#### 6.1.1 图片压缩算法
```javascript
function compressImage(file, maxSize = 1024 * 1024) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            const ratio = Math.min(800 / img.width, 600 / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            let quality = 0.9;
            let result;
            
            do {
                result = canvas.toDataURL('image/jpeg', quality);
                quality -= 0.1;
            } while (result.length > maxSize && quality > 0.1);
            
            resolve(result);
        };
        
        img.src = URL.createObjectURL(file);
    });
}
```

#### 6.1.2 批处理优化
```javascript
async function processBatch(items, batchSize = 5) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
            batch.map(item => processItem(item))
        );
        results.push(...batchResults);
        
        // 进度回调
        if (typeof onProgress === 'function') {
            onProgress((i + batch.length) / items.length);
        }
    }
    
    return results;
}
```

## 7. 安全性实现

### 7.1 输入验证和净化

#### 7.1.1 HTML内容净化
```javascript
function sanitizeHTML(html) {
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'img', 'a', 'h1', 'h2', 'h3'];
    const allowedAttributes = {
        'a': ['href'],
        'img': ['src', 'alt', 'width', 'height']
    };
    
    // 使用DOMParser解析HTML
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    function sanitizeNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            
            if (!allowedTags.includes(tagName)) {
                return node.textContent;
            }
            
            // 清理属性
            const allowedAttrs = allowedAttributes[tagName] || [];
            for (const attr of node.attributes) {
                if (!allowedAttrs.includes(attr.name)) {
                    node.removeAttribute(attr.name);
                }
            }
        }
        
        return node;
    }
    
    // 递归净化所有节点
    function walkNodes(node) {
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_ALL,
            null,
            false
        );
        
        let currentNode;
        while (currentNode = walker.nextNode()) {
            sanitizeNode(currentNode);
        }
    }
    
    walkNodes(doc.body);
    return doc.body.innerHTML;
}
```

#### 7.1.2 URL验证
```javascript
function validateURL(url) {
    try {
        const parsedURL = new URL(url);
        
        // 只允许HTTPS协议
        if (parsedURL.protocol !== 'https:') {
            return false;
        }
        
        // 检查域名白名单
        const allowedDomains = [
            'localhost',
            '127.0.0.1',
            // 添加你的Strapi域名
        ];
        
        const isAllowed = allowedDomains.some(domain => 
            parsedURL.hostname === domain || 
            parsedURL.hostname.endsWith('.' + domain)
        );
        
        return isAllowed;
    } catch {
        return false;
    }
}
```

## 8. 错误处理和日志系统

### 8.1 统一错误处理

#### 8.1.1 错误分类和处理
```javascript
class ErrorHandler {
    static handle(error, context = '') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // 根据错误类型分类处理
        if (error instanceof StrapiError) {
            this.handleStrapiError(error, errorInfo);
        } else if (error instanceof NetworkError) {
            this.handleNetworkError(error, errorInfo);
        } else {
            this.handleGenericError(error, errorInfo);
        }
        
        // 记录日志
        Logger.error(errorInfo);
        
        // 用户友好的错误提示
        return this.getUserFriendlyMessage(error);
    }
    
    static getUserFriendlyMessage(error) {
        const messages = {
            'NetworkError': '网络连接异常，请检查网络设置',
            'StrapiError': 'Strapi服务异常，请检查配置',
            'ValidationError': '数据验证失败，请检查输入',
            'TypeError': '数据格式错误，请重试'
        };
        
        return messages[error.constructor.name] || '操作失败，请重试';
    }
}
```

#### 8.1.2 日志系统
```javascript
class Logger {
    static levels = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };
    
    static currentLevel = this.levels.INFO;
    
    static log(level, message, data = {}) {
        if (level > this.currentLevel) return;
        
        const logEntry = {
            level: Object.keys(this.levels)[level],
            message,
            data,
            timestamp: new Date().toISOString(),
            source: 'WechatArticle2Strapi'
        };
        
        console[this.getConsoleMethod(level)](
            `[${logEntry.level}] ${logEntry.message}`,
            logEntry.data
        );
        
        this.persist(logEntry);
    }
    
    static error(message, data) {
        this.log(this.levels.ERROR, message, data);
    }
    
    static warn(message, data) {
        this.log(this.levels.WARN, message, data);
    }
    
    static info(message, data) {
        this.log(this.levels.INFO, message, data);
    }
}
```

## 9. 测试策略

### 9.1 单元测试框架

#### 9.1.1 测试工具配置
```javascript
// test-setup.js
global.chrome = {
    runtime: {
        sendMessage: jest.fn(),
        onMessage: {
            addListener: jest.fn()
        }
    },
    storage: {
        sync: {
            get: jest.fn(),
            set: jest.fn()
        }
    },
    tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
    }
};

global.fetch = jest.fn();
```

#### 9.1.2 测试用例示例
```javascript
// content.test.js
describe('Content Script', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <h2 class="rich_media_title">测试标题</h2>
            <div class="rich_media_meta_text">测试作者</div>
            <div id="js_content">
                <p>测试内容</p>
                <img src="https://example.com/image.jpg" alt="测试图片">
            </div>
        `;
    });
    
    test('should extract article title', () => {
        const article = extractArticle();
        expect(article.title).toBe('测试标题');
    });
    
    test('should extract images', () => {
        const article = extractArticle();
        expect(article.images).toHaveLength(1);
        expect(article.images[0].src).toBe('https://example.com/image.jpg');
    });
});
```

## 10. 部署和发布

### 10.1 构建流程

#### 10.1.1 构建脚本
```json
{
    "scripts": {
        "build": "npm run lint && npm run test && npm run package",
        "lint": "eslint src/**/*.js",
        "test": "jest",
        "package": "node scripts/package.js",
        "release": "npm run build && node scripts/release.js"
    }
}
```

#### 10.1.2 打包脚本
```javascript
// scripts/package.js
const fs = require('fs');
const archiver = require('archiver');

async function packageExtension() {
    const output = fs.createWriteStream('dist/extension.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    
    // 添加必要文件
    archive.file('manifest.json', { name: 'manifest.json' });
    archive.directory('src/', 'src/');
    archive.directory('icons/', 'icons/');
    
    await archive.finalize();
    console.log('Extension packaged successfully');
}

packageExtension();
```

## 11. 监控和分析

### 11.1 使用情况统计

#### 11.1.1 事件追踪
```javascript
class Analytics {
    static track(event, properties = {}) {
        const data = {
            event,
            properties,
            timestamp: Date.now(),
            version: chrome.runtime.getManifest().version,
            userId: this.getUserId()
        };
        
        // 本地存储统计数据
        this.store(data);
    }
    
    static getUserId() {
        // 生成匿名用户ID
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }
}

// 使用示例
Analytics.track('article_extracted', {
    hasImages: article.images.length > 0,
    contentLength: article.content.length
});
```

### 11.2 性能监控

#### 11.2.1 性能指标收集
```javascript
class PerformanceMonitor {
    static measure(name, fn) {
        return async (...args) => {
            const start = performance.now();
            
            try {
                const result = await fn(...args);
                const duration = performance.now() - start;
                
                this.recordMetric(name, duration, 'success');
                return result;
            } catch (error) {
                const duration = performance.now() - start;
                this.recordMetric(name, duration, 'error');
                throw error;
            }
        };
    }
    
    static recordMetric(name, duration, status) {
        const metric = {
            name,
            duration,
            status,
            timestamp: Date.now()
        };
        
        Analytics.track('performance_metric', metric);
    }
}

// 装饰器使用
const monitoredUpload = PerformanceMonitor.measure('image_upload', uploadImage);
```

---

**文档版本**: v1.0  
**最后更新**: 2024年12月  
**技术栈**: Chrome Extension Manifest V3, JavaScript ES2022, Strapi v4+  
**维护者**: 开发团队