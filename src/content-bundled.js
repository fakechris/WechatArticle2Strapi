import Defuddle from 'defuddle';

// Add debug information to verify Defuddle is loaded
console.log('Defuddle imported:', typeof Defuddle);
console.log('Defuddle class:', Defuddle);

// 规则引擎 - DOM清理规则
const DEFAULT_CLEANUP_RULES = [
  // 微信特定的清理规则（只在微信域名生效）
  { type: 'id', value: 'content_bottom_area', description: '微信底部推荐区域', domains: ['mp.weixin.qq.com'] },
  { type: 'id', value: 'js_article_comment', description: '微信评论区域', domains: ['mp.weixin.qq.com'] },
  { type: 'id', value: 'js_tags', description: '微信标签区域', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'rich_media_tool', description: '微信工具栏', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'share_notice', description: '微信分享提示', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'qr_code_pc', description: '微信二维码', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'reward_area', description: '微信打赏区域', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'promotion_area', description: '推广区域', domains: ['mp.weixin.qq.com'] },
  
  // 知乎特定规则
  { type: 'class', value: 'RichContent-actions', description: '知乎操作栏', domains: ['zhuanlan.zhihu.com', 'www.zhihu.com'] },
  { type: 'class', value: 'ContentItem-actions', description: '知乎内容操作', domains: ['zhuanlan.zhihu.com', 'www.zhihu.com'] },
  { type: 'class', value: 'Recommendations-Main', description: '知乎推荐', domains: ['zhuanlan.zhihu.com', 'www.zhihu.com'] },
  
  // 简书特定规则
  { type: 'class', value: 'follow-detail', description: '简书关注详情', domains: ['www.jianshu.com'] },
  { type: 'class', value: 'recommendation', description: '简书推荐', domains: ['www.jianshu.com'] },
  
  // CSDN特定规则
  { type: 'class', value: 'tool-box', description: 'CSDN工具箱', domains: ['blog.csdn.net'] },
  { type: 'class', value: 'recommend-box', description: 'CSDN推荐', domains: ['blog.csdn.net'] },
  
  // 通用广告和噪音清理（适用于所有网站）
  { type: 'class', value: 'advertisement', description: '广告区域' },
  { type: 'class', value: 'ads', description: '广告' },
  { type: 'class', value: 'banner', description: '横幅广告' },
  { type: 'class', value: 'sidebar', description: '侧边栏' },
  { type: 'class', value: 'footer', description: '页脚' },
  { type: 'class', value: 'navigation', description: '导航栏' },
  { type: 'class', value: 'nav', description: '导航' },
  { type: 'class', value: 'menu', description: '菜单' },
  { type: 'class', value: 'social-share', description: '社交分享' },
  { type: 'class', value: 'comments', description: '评论区' },
  { type: 'class', value: 'related-articles', description: '相关文章' },
  
  // 标签级别清理（适用于所有网站）
  { type: 'tag', value: 'script', description: '脚本标签' },
  { type: 'tag', value: 'style', description: '样式标签' },
  { type: 'tag', value: 'noscript', description: 'NoScript标签' }
];

// 检查域名是否匹配规则
function isDomainMatched(rule, currentHostname) {
  // 如果规则没有指定domains，则适用于所有域名
  if (!rule.domains || !Array.isArray(rule.domains) || rule.domains.length === 0) {
    return true;
  }
  
  // 检查当前hostname是否匹配任何指定域名
  return rule.domains.some(domain => {
    // 精确匹配
    if (currentHostname === domain) {
      return true;
    }
    // 支持通配符匹配（例如: *.zhihu.com）
    if (domain.startsWith('*.')) {
      const baseDomain = domain.substring(2);
      return currentHostname.endsWith('.' + baseDomain) || currentHostname === baseDomain;
    }
    return false;
  });
}

// 应用DOM清理规则
function applyCleanupRules(targetDocument, rules = DEFAULT_CLEANUP_RULES) {
  const currentHostname = window.location.hostname;
  console.log('🧹 Applying DOM cleanup rules:', rules.length, 'for domain:', currentHostname);
  
  let removedCount = 0;
  let appliedRules = 0;
  let skippedRules = 0;
  
  rules.forEach(rule => {
    try {
      // 检查域名匹配
      if (!isDomainMatched(rule, currentHostname)) {
        skippedRules++;
        console.log(`⏭️ Skipping rule for different domain: ${rule.description} (domains: ${rule.domains?.join(', ') || 'all'})`);
        return;
      }
      
      appliedRules++;
      let elements = [];
      
      switch (rule.type) {
        case 'id':
          const elementById = targetDocument.getElementById(rule.value);
          if (elementById) elements = [elementById];
          break;
          
        case 'class':
          elements = Array.from(targetDocument.getElementsByClassName(rule.value));
          break;
          
        case 'tag':
          elements = Array.from(targetDocument.getElementsByTagName(rule.value));
          break;
          
        case 'selector':
          elements = Array.from(targetDocument.querySelectorAll(rule.value));
          break;
          
        case 'regex-class':
          // 通过正则表达式匹配class名
          const allElements = targetDocument.querySelectorAll('[class]');
          const regex = new RegExp(rule.value, 'i');
          elements = Array.from(allElements).filter(el => 
            Array.from(el.classList).some(className => regex.test(className))
          );
          break;
      }
      
      if (elements.length > 0) {
        const domainInfo = rule.domains ? ` [${rule.domains.join(', ')}]` : ' [all domains]';
        console.log(`🗑️ Removing ${elements.length} elements for rule: ${rule.description} (${rule.type}: ${rule.value})${domainInfo}`);
        elements.forEach(element => {
          element.remove();
          removedCount++;
        });
      }
    } catch (error) {
      console.warn(`❌ Error applying cleanup rule ${rule.type}:${rule.value}:`, error);
    }
  });
  
  console.log(`✅ DOM cleanup completed for ${currentHostname}:`);
  console.log(`   📊 Applied rules: ${appliedRules}`);
  console.log(`   ⏭️ Skipped rules: ${skippedRules}`);
  console.log(`   🗑️ Removed elements: ${removedCount}`);
  return removedCount;
}

// Enhanced content extraction using Defuddle for superior content filtering
async function extractArticle() {
  try {
    // Check if we're on a WeChat article page
    const isWeChatArticle = window.location.hostname === 'mp.weixin.qq.com';
    
    console.log('Starting extraction. WeChat article:', isWeChatArticle);
    
    // Apply cleanup rules BEFORE extraction for better results
    console.log('🚀 Starting pre-processing with cleanup rules...');
    
    // Load custom cleanup rules from storage
    let cleanupRules = DEFAULT_CLEANUP_RULES;
    try {
      const storage = await chrome.storage.sync.get(['customCleanupRules', 'enableCleanupRules']);
      if (storage.enableCleanupRules !== false) { // enabled by default
        if (storage.customCleanupRules && Array.isArray(storage.customCleanupRules)) {
          // Merge custom rules with default rules
          cleanupRules = [...DEFAULT_CLEANUP_RULES, ...storage.customCleanupRules];
          console.log('📝 Loaded custom cleanup rules:', storage.customCleanupRules.length);
        }
      } else {
        console.log('⏸️ Cleanup rules disabled by user');
        cleanupRules = [];
      }
    } catch (error) {
      console.warn('⚠️ Could not load custom cleanup rules, using defaults:', error);
    }
    
    const removedElements = applyCleanupRules(document, cleanupRules);
    console.log(`🎯 Pre-processing complete. Removed ${removedElements} noise elements.`);
    
    if (isWeChatArticle) {
      // Use enhanced WeChat-specific extraction
      return extractWeChatArticle();
    } else {
      // Use Defuddle for general web content extraction
      return extractGeneralContent();
    }
  } catch (error) {
    console.error('Content extraction failed:', error);
    // Fallback to basic extraction
    return extractBasicContent();
  }
}

function extractWeChatArticle() {
  // Enhanced WeChat extraction that first tries Defuddle, then falls back to specific selectors
  console.log('Extracting WeChat article with Defuddle enhancement');
  
  try {
    // Try Defuddle first even for WeChat articles to get better content filtering
    console.log('Trying Defuddle for WeChat article...');
    const defuddle = new Defuddle(document, {
      debug: true, // Enable debug for troubleshooting
      removeExactSelectors: true,
      removePartialSelectors: true
    });
    
    const result = defuddle.parse();
    console.log('WeChat Defuddle result:', result);
    
    // If Defuddle found good content, enhance it with WeChat-specific metadata
    if (result && result.content && result.content.length > 100) {
      console.log('Using Defuddle result for WeChat, content length:', result.content.length);
      return enhanceWithWeChatMetadata(result);
    } else {
      console.log('Defuddle result not good enough for WeChat, falling back');
    }
  } catch (error) {
    console.log('Defuddle extraction failed for WeChat, falling back to selectors:', error);
  }
  
  // Fallback to original WeChat selectors if Defuddle didn't work well
  console.log('Using WeChat selector fallback');
  const titleEl = document.querySelector('#activity-name') || 
                  document.querySelector('.rich_media_title') ||
                  document.querySelector('h1');
  
  const authorEl = document.querySelector('#js_name') ||
                   document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('.account_nickname_inner');
  
  const publishTimeEl = document.querySelector('#publish_time') ||
                        document.querySelector('.rich_media_meta_text');
  
  const contentEl = document.querySelector('#js_content') ||
                    document.querySelector('.rich_media_content');
  
  const digestEl = document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('meta[name="description"]');
  
  // Extract images
  const images = [];
  if (contentEl) {
    const imgElements = contentEl.querySelectorAll('img[data-src], img[src]');
    imgElements.forEach((img, index) => {
      const src = img.getAttribute('data-src') || img.src;
      if (src && !src.startsWith('data:')) {
        images.push({
          src: src,
          alt: img.alt || '',
          index: index
        });
      }
    });
  }

  return {
    title: titleEl ? titleEl.innerText.trim() : '',
    author: authorEl ? authorEl.innerText.trim() : '',
    publishTime: publishTimeEl ? publishTimeEl.innerText.trim() : '',
    content: contentEl ? contentEl.innerHTML : '',
    digest: digestEl ? (digestEl.content || digestEl.innerText || '').trim() : '',
    images: images,
    url: window.location.href,
    timestamp: Date.now(),
    extractionMethod: 'wechat-fallback'
  };
}

function enhanceWithWeChatMetadata(defuddleResult) {
  // Get WeChat-specific metadata and combine with Defuddle's cleaned content
  const authorEl = document.querySelector('#js_name') ||
                   document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('.account_nickname_inner');
  
  const publishTimeEl = document.querySelector('#publish_time') ||
                        document.querySelector('.rich_media_meta_text');
  
  const digestEl = document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('meta[name="description"]');

  // Extract images from the cleaned content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = defuddleResult.content;
  const imgElements = tempDiv.querySelectorAll('img');
  const images = [];
  
  imgElements.forEach((img, index) => {
    const src = img.getAttribute('data-src') || img.src;
    if (src && !src.startsWith('data:')) {
      images.push({
        src: src,
        alt: img.alt || '',
        index: index
      });
    }
  });

  return {
    title: defuddleResult.title || '',
    author: defuddleResult.author || (authorEl ? authorEl.innerText.trim() : ''),
    publishTime: defuddleResult.published || (publishTimeEl ? publishTimeEl.innerText.trim() : ''),
    content: defuddleResult.content || '',
    digest: defuddleResult.description || (digestEl ? (digestEl.content || digestEl.innerText || '').trim() : ''),
    images: images,
    url: defuddleResult.url || window.location.href,
    timestamp: Date.now(),
    extractionMethod: 'defuddle-enhanced-wechat',
    wordCount: defuddleResult.wordCount || 0,
    parseTime: defuddleResult.parseTime || 0,
    domain: defuddleResult.domain || '',
    site: defuddleResult.site || ''
  };
}

function extractGeneralContent() {
  // Use Defuddle for general web content extraction
  console.log('Extracting general content with Defuddle');
  console.log('Defuddle constructor available:', typeof Defuddle);
  
  try {
    console.log('Creating Defuddle instance...');
    const defuddle = new Defuddle(document, {
      debug: true, // Enable debug for troubleshooting
      removeExactSelectors: true,
      removePartialSelectors: true
    });
    
    console.log('Defuddle instance created, calling parse...');
    const result = defuddle.parse();
    console.log('Defuddle parse result:', result);
    console.log('Content length:', result?.content?.length || 0);
    
    if (!result || !result.content || result.content.length < 50) {
      console.log('Defuddle extraction yielded poor results, falling back');
      console.log('Result details:', {
        hasResult: !!result,
        hasContent: !!result?.content,
        contentLength: result?.content?.length || 0
      });
      return extractBasicContent();
    }
    
    console.log('Defuddle extraction successful, processing images...');
    
    // Extract images from the cleaned content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.content;
    const imgElements = tempDiv.querySelectorAll('img');
    const images = [];
    
    imgElements.forEach((img, index) => {
      if (img.src && !img.src.startsWith('data:')) {
        images.push({
          src: img.src,
          alt: img.alt || '',
          index: index
        });
      }
    });
    
    const finalResult = {
      title: result.title || document.title || '',
      author: result.author || '',
      publishTime: result.published || '',
      content: result.content || '',
      digest: result.description || '',
      images: images,
      url: result.url || window.location.href,
      timestamp: Date.now(),
      extractionMethod: 'defuddle',
      wordCount: result.wordCount || 0,
      parseTime: result.parseTime || 0,
      domain: result.domain || '',
      site: result.site || ''
    };
    
    console.log('Final Defuddle result:', {
      method: finalResult.extractionMethod,
      titleLength: finalResult.title.length,
      contentLength: finalResult.content.length,
      imageCount: finalResult.images.length
    });
    
    return finalResult;
  } catch (error) {
    console.error('Defuddle extraction failed:', error);
    console.error('Error stack:', error.stack);
    return extractBasicContent();
  }
}

function extractBasicContent() {
  // Basic fallback extraction for when Defuddle is not available or fails
  console.log('Using basic content extraction fallback');
  
  // Try to find the main content area
  const contentSelectors = [
    'article',
    'main',
    '.content',
    '.post-content',
    '.article-content',
    '.entry-content',
    '#content',
    '.main-content',
    '[role="main"]'
  ];
  
  let contentEl = null;
  for (const selector of contentSelectors) {
    contentEl = document.querySelector(selector);
    if (contentEl && contentEl.innerText.length > 200) {
      console.log('Found content with selector:', selector);
      break;
    }
  }
  
  // If no good content area found, try to get the largest text block
  if (!contentEl) {
    console.log('No good content selector found, trying largest text block...');
    const allDivs = document.querySelectorAll('div, section, article');
    let maxLength = 0;
    for (const div of allDivs) {
      const textLength = div.innerText ? div.innerText.length : 0;
      if (textLength > maxLength && textLength > 200) {
        maxLength = textLength;
        contentEl = div;
      }
    }
    console.log('Largest text block length:', maxLength);
  }
  
  // Get images from the content area
  const images = [];
  if (contentEl) {
    const imgElements = contentEl.querySelectorAll('img');
    imgElements.forEach((img, index) => {
      if (img.src && !img.src.startsWith('data:')) {
        images.push({
          src: img.src,
          alt: img.alt || '',
          index: index
        });
      }
    });
  }
  
  // Get title
  const title = document.querySelector('h1')?.innerText?.trim() || 
                document.title || 
                '';
  
  // Get meta description
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                   document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                   '';
  
  const basicResult = {
    title: title,
    author: '',
    publishTime: '',
    content: contentEl ? contentEl.innerHTML : '',
    digest: metaDesc,
    images: images,
    url: window.location.href,
    timestamp: Date.now(),
    extractionMethod: 'basic-fallback'
  };
  
  console.log('Basic extraction result:', {
    method: basicResult.extractionMethod,
    titleLength: basicResult.title.length,
    contentLength: basicResult.content.length,
    imageCount: basicResult.images.length
  });
  
  return basicResult;
}

async function downloadImage(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'extract') {
    console.log('Received extract request');
    
    // Handle async extraction
    extractArticle().then(articleData => {
      console.log('Extracted article data:', {
        method: articleData.extractionMethod,
        title: articleData.title,
        contentLength: articleData.content ? articleData.content.length : 0,
        wordCount: articleData.wordCount,
        imageCount: articleData.images ? articleData.images.length : 0
      });
      sendResponse(articleData);
    }).catch(error => {
      console.error('Extraction failed:', error);
      sendResponse({ error: error.message });
    });
    
    return true; // Keep message channel open for async response
  } else if (msg.type === 'downloadImage') {
    downloadImage(msg.url).then(dataUrl => {
      sendResponse({ success: true, dataUrl });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Add debug information to console
console.log('Enhanced Smart Article Extractor content script loaded with Defuddle support');
console.log('Current domain:', window.location.hostname);
console.log('Defuddle available at load:', typeof Defuddle); 