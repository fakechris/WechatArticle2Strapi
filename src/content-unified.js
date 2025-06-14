/**
 * Chrome Extension Content Script - 统一架构版
 * 使用共享的WeChatExtractor，解决懒加载图片问题
 */

console.log('🚀 统一架构Content Script加载开始');
console.log('🌐 当前URL:', window.location.href);

// 导入共享的提取器（通过动态导入或bundling）
let WeChatExtractor;

// 初始化共享提取器
async function initializeExtractor() {
  try {
    // 在实际部署中，这些会通过webpack bundling包含
    // 这里模拟共享架构的加载
    const { createWeChatExtractor } = await import('../../shared/core/index.js');
    
    WeChatExtractor = createWeChatExtractor({
      environment: 'browser',
      debug: true,
      verbose: true,
      defuddleConfig: {
        removeExactSelectors: false,
        removePartialSelectors: false,
        minContentLength: 100
      }
    });
    
    console.log('✅ 共享提取器初始化成功');
    return true;
  } catch (error) {
    console.error('❌ 共享提取器初始化失败:', error);
    return false;
  }
}

// 使用统一架构的提取函数
async function extractArticleUnified(options = {}) {
  console.log('🚀 开始统一架构文章提取...');
  
  try {
    // 确保提取器已初始化
    if (!WeChatExtractor) {
      const success = await initializeExtractor();
      if (!success) {
        throw new Error('提取器初始化失败');
      }
    }
    
    // 使用共享提取器进行提取
    const result = await WeChatExtractor.extract(document, window.location.href, {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    
    console.log('✅ 统一架构提取完成:', {
      title: result.title,
      contentLength: result.content?.length || 0,
      imageCount: result.images?.length || 0,
      extractionMethod: result.extractionMethod
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ 统一架构提取失败:', error);
    
    // 回退到基础提取
    console.log('🔄 回退到基础提取...');
    return extractBasicArticle();
  }
}

// 基础提取函数（作为回退）
function extractBasicArticle() {
  console.log('🎯 执行基础文章提取（回退模式）...');
  
  const isWeChatPage = window.location.href.includes('mp.weixin.qq.com');
  
  // 基础图片提取（带懒加载支持）
  function extractImagesBasic() {
    const images = [];
    const seenUrls = new Set();
    
    // 查找所有图片元素
    const imgElements = document.querySelectorAll('img');
    
    imgElements.forEach((img, index) => {
      // 获取图片源（懒加载兼容）
      let src = img.getAttribute('data-src') || 
                img.getAttribute('data-original') || 
                img.getAttribute('data-lazy') ||
                img.src;
      
      if (src && !src.startsWith('data:') && !seenUrls.has(src)) {
        // 过滤占位符
        const isPlaceholder = ['placeholder', 'loading', 'blank', '1x1'].some(
          indicator => src.toLowerCase().includes(indicator)
        );
        
        if (!isPlaceholder) {
          seenUrls.add(src);
          images.push({
            src: src,
            alt: img.alt || '',
            index: index,
            isLazyLoaded: img.hasAttribute('data-src') || img.hasAttribute('data-original')
          });
        }
      }
    });
    
    console.log(`📷 基础模式提取到 ${images.length} 张图片`);
    return images;
  }
  
  // 基础内容提取
  const title = document.querySelector('#activity-name')?.textContent?.trim() || 
               document.querySelector('.rich_media_title')?.textContent?.trim() ||
               document.title || 'No title found';
  
  const contentEl = document.querySelector('#js_content') || 
                   document.querySelector('.rich_media_content');
  const content = contentEl ? contentEl.innerHTML : document.body.innerHTML;
  
  const images = extractImagesBasic();
  
  return {
    title,
    content,
    images,
    url: window.location.href,
    extractionMethod: 'basic-fallback-with-lazy-support',
    timestamp: new Date().toISOString(),
    isWeChatPage
  };
}

// 消息监听器
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 收到消息:', {
    type: request.type,
    sender: sender.tab ? `Tab ${sender.tab.id}` : 'Extension'
  });
  
  if (request.type === 'EXTRACT_UNIFIED' || request.type === 'FULL_EXTRACT') {
    console.log('🎯 处理统一架构提取请求');
    
    // 异步处理
    extractArticleUnified(request.options || {})
      .then(article => {
        console.log('✅ 提取成功，发送响应');
        sendResponse({ success: true, data: article });
      })
      .catch(error => {
        console.error('❌ 提取失败:', error);
        sendResponse({ 
          success: false, 
          error: error.message,
          data: extractBasicArticle() // 提供回退数据
        });
      });
    
    return true; // 保持消息通道开放用于异步响应
  }
  
  // 兼容旧的提取请求
  if (request.type === 'extract' || request.type === 'EXTRACT_ARTICLE') {
    console.log('🔄 处理兼容性提取请求');
    
    try {
      const article = extractBasicArticle();
      sendResponse(article);
    } catch (error) {
      console.error('❌ 兼容性提取失败:', error);
      sendResponse({
        title: '提取失败',
        content: '提取过程中发生错误',
        error: error.message
      });
    }
  }
});

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM加载完成，开始初始化...');
  
  // 预初始化提取器（可选）
  initializeExtractor().then(success => {
    if (success) {
      console.log('🎉 统一架构初始化完成');
    } else {
      console.log('⚠️ 将使用基础提取模式');
    }
  });
});

console.log('📝 统一架构Content Script加载完成'); 