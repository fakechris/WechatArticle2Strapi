/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/**
 * Chrome Extension Content Script - 懒加载图片修复版
 * 解决微信公众号文章懒加载图片无法提取的问题
 */

console.log('🚀 Content Script加载开始（懒加载修复版）');
console.log('🌐 当前URL:', window.location.href);
console.log('📄 DOM状态:', document.readyState);

// 添加基础功能检测
console.log('🔧 基础功能检测:', {
  hasChrome: typeof chrome !== 'undefined',
  hasDocument: typeof document !== 'undefined',
  hasWindow: typeof window !== 'undefined'
});

// 完整文章提取函数 - 含懒加载支持
async function extractFullArticle(options = {}) {
  console.log('🚀 开始完整文章提取（含懒加载支持）...');
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
  
  // 🔥 核心修复：提取图片（支持懒加载）
  let images = [];
  if (contentElement) {
    console.log('🖼️ 开始提取图片（含懒加载支持）...');
    
    // 先尝试触发懒加载
    await triggerLazyLoadingQuick(contentElement);
    
    const imgElements = contentElement.querySelectorAll('img');
    console.log(`发现 ${imgElements.length} 个图片元素`);
    
    images = Array.from(imgElements).map((img, index) => {
      // 懒加载兼容：优先获取 data-src 等属性
      let src = img.getAttribute('data-src') || 
                img.getAttribute('data-original') || 
                img.getAttribute('data-lazy') ||
                img.getAttribute('data-url') ||
                img.src;
      
      return {
        src: src,
        alt: img.alt || '',
        title: img.title || '',
        index: index,
        isLazyLoaded: img.hasAttribute('data-src') || img.hasAttribute('data-original'),
        originalSrc: img.src,
        dataSrc: img.getAttribute('data-src'),
        dataOriginal: img.getAttribute('data-original')
      };
    }).filter(img => {
      // 过滤有效图片URL，排除占位符
      if (!img.src || img.src.startsWith('data:')) return false;
      
      const placeholderIndicators = ['placeholder', 'loading', 'blank', '1x1', 'spacer'];
      const isPlaceholder = placeholderIndicators.some(indicator => 
        img.src.toLowerCase().includes(indicator)
      );
      
      return !isPlaceholder;
    });
    
    console.log(`✅ 提取到 ${images.length} 张图片（含懒加载支持）`);
    console.log('图片统计:', {
      total: images.length,
      lazyLoaded: images.filter(img => img.isLazyLoaded).length,
      direct: images.filter(img => !img.isLazyLoaded).length
    });
    
    // 打印前3张图片的详细信息用于调试
    images.slice(0, 3).forEach((img, i) => {
      console.log(`图片 ${i + 1}:`, {
        src: img.src.substring(0, 60) + '...',
        isLazyLoaded: img.isLazyLoaded,
        hasDataSrc: !!img.dataSrc
      });
    });
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
    images,   // 🔥 包含懒加载图片
    url: window.location.href,
    siteName: author || '微信公众号',
    slug: generateSlug(title),
    domain: window.location.hostname,
    wordCount,
    extractionMethod: 'wechat-enhanced-full-with-lazy-loading',
    timestamp: new Date().toISOString(),
    isWeChatPage,
    // 🔥 新增：懒加载统计信息
    lazyLoadingStats: {
      totalImages: images.length,
      lazyLoadedImages: images.filter(img => img.isLazyLoaded).length,
      directImages: images.filter(img => !img.isLazyLoaded).length
    }
  };
  
  console.log('✅ 完整提取完成:', {
    title: article.title,
    contentLength: article.content.length,
    imageCount: article.images.length,
    wordCount: article.wordCount,
    hasDigest: !!article.digest,
    lazyLoadingStats: article.lazyLoadingStats
  });
  
  return article;
}

// 快速懒加载触发函数
async function triggerLazyLoadingQuick(container) {
  console.log('🔄 开始触发懒加载...');
  
  try {
    // 方法1：强制加载所有懒加载图片
    const lazyImages = container.querySelectorAll('img[data-src], img[data-original], img[data-lazy]');
    console.log(`发现 ${lazyImages.length} 张懒加载图片`);
    
    let loadedCount = 0;
    const loadPromises = [];
    
    lazyImages.forEach(img => {
      const dataSrc = img.getAttribute('data-src') || 
                     img.getAttribute('data-original') || 
                     img.getAttribute('data-lazy');
      
      if (dataSrc && !isPlaceholderSrc(dataSrc)) {
        const loadPromise = new Promise((resolve) => {
          const originalSrc = img.src;
          
          img.onload = () => {
            loadedCount++;
            console.log(`✅ 懒加载图片加载成功: ${dataSrc.substring(0, 50)}...`);
            resolve();
          };
          
          img.onerror = () => {
            console.log(`❌ 懒加载图片加载失败: ${dataSrc.substring(0, 50)}...`);
            img.src = originalSrc; // 恢复原始src
            resolve();
          };
          
          // 触发加载
          img.src = dataSrc;
          
          // 保留懒加载属性用于识别，但设置已处理标记
          img.setAttribute('data-lazy-processed', 'true');
        });
        
        loadPromises.push(loadPromise);
      }
    });
    
    if (loadPromises.length > 0) {
      await Promise.allSettled(loadPromises);
      console.log(`🖼️ 强制加载了 ${loadedCount} 张懒加载图片`);
    }
    
    // 方法2：滚动触发（作为备用）
    await scrollToTriggerLazyLoad();
    
    // 等待一段时间让图片加载
    await sleep(500);
    
    console.log('✅ 懒加载触发完成');
  } catch (error) {
    console.log(`⚠️ 懒加载触发失败: ${error.message}`);
  }
}

// 判断是否是占位符图片
function isPlaceholderSrc(src) {
  if (!src) return true;
  
  const placeholderIndicators = [
    'placeholder', 'loading', 'blank', 'transparent', 
    '1x1', 'spacer', 'pixel.gif', 'default.jpg'
  ];
  
  const srcLower = src.toLowerCase();
  return placeholderIndicators.some(indicator => srcLower.includes(indicator));
}

// 滚动页面触发懒加载
async function scrollToTriggerLazyLoad() {
  const originalScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  try {
    // 滚动到页面底部
    const scrollHeight = document.body.scrollHeight;
    const steps = 3; // 减少步数提高速度
    const stepSize = scrollHeight / steps;
    
    for (let i = 0; i <= steps; i++) {
      const scrollTo = i * stepSize;
      window.scrollTo(0, scrollTo);
      await sleep(100); // 等待懒加载触发
    }
    
    console.log('📜 滚动触发懒加载完成');
  } finally {
    // 恢复原始滚动位置
    window.scrollTo(0, originalScrollTop);
  }
}

// 睡眠函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// 消息监听器（支持异步处理）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 收到消息:', {
    type: request.type,
    sender: sender.tab ? `Tab ${sender.tab.id}` : 'Extension',
    options: request.options
  });
  
  if (request.type === 'extract' || request.type === 'EXTRACT_ARTICLE' || request.type === 'FULL_EXTRACT') {
    console.log('🎯 处理提取请求:', request.type);
    
    // 异步处理
    (async () => {
      try {
        let article;
        
        if (request.type === 'FULL_EXTRACT') {
          // 使用完整提取逻辑（含懒加载）
          console.log('🔄 执行完整提取逻辑（含懒加载）...');
          article = await extractFullArticle(request.options);
        } else {
          // 基础提取逻辑（向后兼容）
          console.log('🔄 执行基础提取逻辑...');
          article = extractBasicArticle();
        }
        
        console.log('📤 提取完成，验证数据:', {
          requestType: request.type,
          hasArticle: !!article,
          articleTitle: article?.title,
          contentLength: article?.content?.length || 0,
          hasImages: !!(article?.images && article.images.length > 0),
          imageCount: article?.images?.length || 0,
          extractionMethod: article?.extractionMethod
        });

        // 验证关键数据
        if (!article) {
          throw new Error('提取函数返回空数据');
        }
        
        if (!article.title || article.title.trim() === '') {
          console.warn('⚠️ 标题为空，使用页面标题作为备选');
          article.title = document.title || '未知标题';
        }
        
        if (!article.content || article.content.trim() === '') {
          console.warn('⚠️ 内容为空，使用body内容作为备选');
          article.content = document.body ? document.body.innerHTML : '无内容';
        }
        
        // 确保数据完整性
        article.url = article.url || window.location.href;
        article.extractedAt = article.extractedAt || new Date().toISOString();
        
        console.log('✅ 数据验证通过，准备发送响应:', {
          title: article.title,
          contentLength: article.content.length,
          imageCount: article.images?.length || 0,
          hasUrl: !!article.url,
          hasTimestamp: !!article.extractedAt
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
        
        // 创建错误时的备选数据
        const fallbackArticle = {
          title: document.title || '提取失败',
          content: '提取过程中发生错误',
          url: window.location.href,
          extractionMethod: 'error-fallback',
          extractedAt: new Date().toISOString(),
          error: error.message
        };
        
        if (request.type === 'extract') {
          console.log('📤 发送备选数据（extract）');
          sendResponse(fallbackArticle);
        } else {
          console.log('📤 发送错误响应');
          sendResponse({ success: false, error: error.message, data: fallbackArticle });
        }
      }
    })();
    
    return true; // 保持消息通道开放用于异步响应
  }
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
  indicator.textContent = 'Content Script Active (懒加载修复版) ✅';
  
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
  console.log('📄 初始化content script（懒加载修复版）');
  
  // 添加可视化指示器
  addLoadIndicator();
  
  // 检查是否为微信文章页面
  if (window.location.href.includes('mp.weixin.qq.com')) {
    console.log('🔍 检测到微信文章页面');
    
    // 预扫描懒加载图片
    const lazyImages = document.querySelectorAll('img[data-src], img[data-original], img[data-lazy]');
    console.log(`👀 预扫描发现 ${lazyImages.length} 张懒加载图片`);
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
  extractFullArticle,
  triggerLazyLoadingQuick,
  isWeChatPage: () => window.location.href.includes('mp.weixin.qq.com')
};

console.log('🎉 Content script设置完成（懒加载修复版）'); 
/******/ })()
;