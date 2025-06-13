/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/**
 * Chrome Extension Content Script - 简化测试版
 * 先恢复基础功能，然后逐步升级到统一架构
 */

console.log('🚀 Content Script加载开始');
console.log('🌐 当前URL:', window.location.href);
console.log('📄 DOM状态:', document.readyState);

// 添加基础功能检测
console.log('🔧 基础功能检测:', {
  hasChrome: typeof chrome !== 'undefined',
  hasDocument: typeof document !== 'undefined',
  hasWindow: typeof window !== 'undefined'
});

// 完整文章提取函数 - 和CLI使用相同逻辑
function extractFullArticle(options = {}) {
  console.log('🚀 开始完整文章提取（CLI同等逻辑）...');
  console.log('提取选项:', options);
  
  const isWeChatPage = window.location.href.includes('mp.weixin.qq.com');
  console.log('🔍 页面类型检查:', {
    url: window.location.href,
    isWeChatPage,
    hostname: window.location.hostname
  });
  
  // 使用和CLI相同的微信选择器优先级
  const WECHAT_SELECTORS = {
    title: [
      '#activity-name',           // 微信文章标题主选择器
      '.rich_media_title',        // 备选标题选择器
      '[id*="title"]',           // 任何包含title的id
      'h1'                       // HTML标准标题
    ],
    author: [
      '#js_name',                // 微信公众号名称
      '.account_nickname_inner', // 账号昵称
      '.profile_nickname',       // 简介昵称
      '[id*="author"]',          // 任何包含author的id
      '.author'                  // 通用作者类
    ],
    publishTime: [
      '#publish_time',           // 发布时间ID
      '.publish_time',           // 发布时间类
      '[id*="time"]',           // 任何包含time的id
      '.time'                   // 通用时间类
    ],
    content: [
      '#js_content',            // 微信文章内容主选择器
      '.rich_media_content',    // 富媒体内容
      '[id*="content"]',        // 任何包含content的id
      '.article-content',       // 通用文章内容
      '.content'               // 通用内容类
    ]
  };
  
  // 提取标题 - 按优先级尝试
  let title = '';
  for (const selector of WECHAT_SELECTORS.title) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      title = element.textContent.trim();
      console.log(`✅ 标题提取成功 (${selector}):`, title);
      break;
    }
  }
  
  // 如果还没有标题，使用document.title作为备选
  if (!title) {
    title = document.title || 'No title found';
    console.log('⚠️ 使用document.title作为备选:', title);
  }
  
  // 提取作者 - 按优先级尝试
  let author = '';
  for (const selector of WECHAT_SELECTORS.author) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      author = element.textContent.trim();
      console.log(`✅ 作者提取成功 (${selector}):`, author);
      break;
    }
  }
  
  // 提取发布时间
  let publishTime = '';
  for (const selector of WECHAT_SELECTORS.publishTime) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      publishTime = element.textContent.trim();
      console.log(`✅ 发布时间提取成功 (${selector}):`, publishTime);
      break;
    }
  }
  
  // 提取内容 - 按优先级尝试，保留完整HTML
  let content = '';
  let contentElement = null;
  for (const selector of WECHAT_SELECTORS.content) {
    const element = document.querySelector(selector);
    if (element && element.innerHTML.trim()) {
      contentElement = element;
      content = element.innerHTML.trim();
      console.log(`✅ 内容提取成功 (${selector}), 长度:`, content.length);
      break;
    }
  }
  
  // 如果没有找到内容，使用整个body（但这通常不理想）
  if (!content) {
    content = document.body ? document.body.innerHTML : '';
    console.log('⚠️ 使用整个body作为内容备选, 长度:', content.length);
  }
  
  // 提取摘要 - 使用和CLI相同的META优先策略
  let digest = '';
  const metaDesc = document.querySelector('meta[name="description"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  
  if (metaDesc && metaDesc.content) {
    digest = metaDesc.content.trim();
    console.log('✅ 从meta description提取摘要:', digest.substring(0, 50) + '...');
  } else if (ogDesc && ogDesc.content) {
    digest = ogDesc.content.trim();
    console.log('✅ 从og:description提取摘要:', digest.substring(0, 50) + '...');
  } else if (twitterDesc && twitterDesc.content) {
    digest = twitterDesc.content.trim();
    console.log('✅ 从twitter:description提取摘要:', digest.substring(0, 50) + '...');
  } else if (content) {
    // 从内容中生成摘要
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    digest = textContent.substring(0, 150);
    if (textContent.length > 150) digest += '...';
    console.log('✅ 从内容生成摘要:', digest.substring(0, 50) + '...');
  }
  
  // 提取图片 - 从内容区域
  let images = [];
  if (contentElement) {
    const imgElements = contentElement.querySelectorAll('img');
    images = Array.from(imgElements).map(img => ({
      src: img.src,
      alt: img.alt || '',
      title: img.title || ''
    })).filter(img => img.src && !img.src.startsWith('data:'));
    console.log(`✅ 提取到 ${images.length} 张图片`);
  }
  
  // 计算字数
  const textContent = content.replace(/<[^>]*>/g, '');
  const wordCount = (textContent.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g) || []).length;
  
  const article = {
    title,
    author,
    publishTime,
    content,  // 完整内容，不截断
    digest,
    images,
    url: window.location.href,
    siteName: author || '微信公众号',
    slug: generateSlug(title),
    domain: window.location.hostname,
    wordCount,
    extractionMethod: 'wechat-enhanced-full',
    timestamp: new Date().toISOString(),
    isWeChatPage
  };
  
  console.log('✅ 完整提取完成:', {
    title: article.title,
    contentLength: article.content.length,
    imageCount: article.images.length,
    wordCount: article.wordCount,
    hasDigest: !!article.digest
  });
  
  return article;
}

// 生成slug的简单实现
function generateSlug(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 替换空格和下划线为连字符
    .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
}

// 简单的文章提取函数（带详细日志）
function extractBasicArticle() {
  console.log('🎯 开始基础文章提取...');
  
  // 检查页面类型
  const isWeChatPage = window.location.href.includes('mp.weixin.qq.com');
  console.log('🔍 页面检查:', {
    url: window.location.href,
    isWeChatPage,
    hostname: window.location.hostname
  });
  
  // 提取HTML内容（保留格式）
  let content = 'No content';
  if (document.body) {
    // 对于微信文章，尝试提取主要内容区域
    if (isWeChatPage) {
      const contentSelector = '#js_content, .rich_media_content, [id*="content"]';
      const contentElement = document.querySelector(contentSelector);
      if (contentElement) {
        content = contentElement.innerHTML;
        console.log('🔍 微信文章内容提取:', {
          selector: contentSelector,
          contentLength: content.length,
          hasHTML: /<[^>]+>/.test(content)
        });
      } else {
        content = document.body.innerHTML;
        console.log('🔍 使用整个body内容作为后备');
      }
    } else {
      content = document.body.innerHTML;
    }
    
    // 保留完整内容，不截断
    console.log('📝 提取完整内容，长度:', content.length);
  }

  const article = {
    title: document.title || 'No title found',
    url: window.location.href,
    content: content,
    extractionMethod: 'basic-test-with-html',
    timestamp: new Date().toISOString(),
    isWeChatPage
  };
  
  console.log('✅ 基础提取完成:', {
    title: article.title,
    contentLength: article.content.length,
    url: article.url,
    isWeChatPage: article.isWeChatPage
  });
  
  return article;
}

// 消息监听器（带详细日志）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 收到消息:', {
    type: request.type,
    sender: sender.tab ? `Tab ${sender.tab.id}` : 'Extension'
  });
  
  if (request.type === 'extract' || request.type === 'EXTRACT_ARTICLE' || request.type === 'FULL_EXTRACT') {
    console.log('🎯 处理提取请求:', request.type);
    
    try {
      let article;
      
      if (request.type === 'FULL_EXTRACT') {
        // 使用完整提取逻辑（和CLI一致）
        console.log('🔄 执行完整提取逻辑...');
        article = extractFullArticle(request.options);
      } else {
        // 基础提取逻辑（向后兼容）
        article = extractBasicArticle();
      }
      
      console.log('📤 准备发送响应:', {
        requestType: request.type,
        hasArticle: !!article,
        articleTitle: article?.title,
        contentLength: article?.content?.length || 0
      });
      
      // 兼容不同响应格式
      if (request.type === 'extract') {
        console.log('📤 发送article格式响应（popup.js兼容）');
        sendResponse(article); // popup.js期望的格式
      } else {
        console.log('📤 发送包装格式响应');
        sendResponse({ success: true, data: article });
      }
    } catch (error) {
      console.error('❌ 提取错误:', error);
      
      if (request.type === 'extract') {
        sendResponse(null);
      } else {
        sendResponse({ success: false, error: error.message });
      }
    }
  }
  
  return true; // 保持消息通道开放
});

// 添加可视化加载指示器
function addLoadIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'content-script-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  indicator.textContent = 'Content Script Active ✅';
  
  if (document.body) {
    document.body.appendChild(indicator);
    
    // 3秒后移除
    setTimeout(() => {
      if (document.body.contains(indicator)) {
        document.body.removeChild(indicator);
      }
    }, 3000);
  } else {
    // 如果body还没有加载，等待一下再添加
    setTimeout(() => {
      if (document.body) {
        document.body.appendChild(indicator);
        setTimeout(() => {
          if (document.body.contains(indicator)) {
            document.body.removeChild(indicator);
          }
        }, 3000);
      }
    }, 100);
  }
}

// DOM加载完成后的初始化
function initialize() {
  console.log('📄 初始化content script');
  
  // 添加可视化指示器
  addLoadIndicator();
  
  // 检查是否为微信文章页面
  if (window.location.href.includes('mp.weixin.qq.com')) {
    console.log('🔍 检测到微信文章页面');
  }
}

// 根据DOM状态执行初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// 导出函数供其他脚本使用
window.wechatExtractor = {
  extractBasicArticle,
  isWeChatPage: () => window.location.href.includes('mp.weixin.qq.com')
};

console.log('🎉 Content script设置完成'); 
/******/ })()
;