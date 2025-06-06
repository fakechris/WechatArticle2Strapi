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
    console.log(`🖼️ 从微信选择器方式找到 ${imgElements.length} 个图片元素`);
    
    imgElements.forEach((img, index) => {
      const src = img.getAttribute('data-src') || img.src;
      console.log(`🔍 检查图片 ${index + 1}: ${src?.substring(0, 80)}...`);
      if (isValidImageUrl(src)) {
        console.log(`✅ 添加有效图片: ${src}`);
        images.push({
          src: src,
          alt: img.alt || '',
          index: index
        });
      } else {
        console.log(`❌ 跳过无效图片: ${src}`);
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
  const seenUrls = new Set(); // 用于去重
  
  console.log(`🖼️ 从Defuddle清理的内容中找到 ${imgElements.length} 个图片元素`);
  
  imgElements.forEach((img, index) => {
    const src = img.getAttribute('data-src') || img.src;
    console.log(`🔍 检查图片 ${index + 1}: ${src?.substring(0, 80)}...`);
    
    if (isValidImageUrl(src)) {
      // 检查URL是否已经存在
      if (seenUrls.has(src)) {
        console.log(`🔄 跳过重复图片: ${src}`);
        return;
      }
      
      seenUrls.add(src);
      console.log(`✅ 添加有效图片: ${src}`);
      images.push({
        src: src,
        alt: img.alt || '',
        index: index
      });
    } else {
      console.log(`❌ 跳过无效图片: ${src}`);
    }
  });
  

  
  console.log(`📊 图片去重完成，最终收集到 ${images.length} 个唯一图片`);

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
    const seenUrls = new Set(); // 用于去重
    
    console.log(`🖼️ 从Defuddle通用内容中找到 ${imgElements.length} 个图片元素`);
    
    imgElements.forEach((img, index) => {
      const src = img.src;
      console.log(`🔍 检查图片 ${index + 1}: ${src?.substring(0, 80)}...`);
      
      if (isValidImageUrl(src)) {
        // 检查URL是否已经存在
        if (seenUrls.has(src)) {
          console.log(`🔄 跳过重复图片: ${src}`);
          return;
        }
        
        seenUrls.add(src);
        console.log(`✅ 添加有效图片: ${src}`);
        images.push({
          src: src,
          alt: img.alt || '',
          index: index
        });
      } else {
        console.log(`❌ 跳过无效图片: ${src}`);
      }
    });
    
    console.log(`📊 通用内容图片去重完成，最终收集到 ${images.length} 个唯一图片`);
    
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
  const seenUrls = new Set(); // 用于去重
  
  if (contentEl) {
    const imgElements = contentEl.querySelectorAll('img');
    console.log(`🖼️ 从基础内容提取中找到 ${imgElements.length} 个图片元素`);
    
    imgElements.forEach((img, index) => {
      const src = img.src;
      console.log(`🔍 检查图片 ${index + 1}: ${src?.substring(0, 80)}...`);
      
      if (isValidImageUrl(src)) {
        // 检查URL是否已经存在
        if (seenUrls.has(src)) {
          console.log(`🔄 跳过重复图片: ${src}`);
          return;
        }
        
        seenUrls.add(src);
        console.log(`✅ 添加有效图片: ${src}`);
        images.push({
          src: src,
          alt: img.alt || '',
          index: index
        });
      } else {
        console.log(`❌ 跳过无效图片: ${src}`);
      }
    });
  }
  
  console.log(`📊 基础内容图片去重完成，最终收集到 ${images.length} 个唯一图片`);
  
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

// Enhanced metadata extraction inspired by Obsidian Clipper
function extractEnhancedMetadata(document) {
  console.log('🔍 Extracting enhanced metadata...');
  
  const metadata = {
    title: '',
    source: window.location.href,
    author: '',
    published: '',
    created: new Date().toISOString(),
    description: '',
    siteName: '',
    canonical: '',
    language: '',
    tags: [],
    readingTime: 0
  };

  // Title extraction (multiple sources)
  metadata.title = 
    document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
    document.querySelector('title')?.textContent ||
    document.querySelector('h1')?.textContent ||
    '';

  // Author extraction (comprehensive approach like Obsidian Clipper)
  const authorSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]', 
    'meta[property="og:article:author"]',
    'meta[name="twitter:creator"]',
    '[rel="author"]',
    '.byline',
    '.author',
    '.writer',
    '.post-author',
    '.article-author',
    '[class*="author"]',
    '[data-author]'
  ];
  
  for (const selector of authorSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.tagName === 'META') {
        metadata.author = element.getAttribute('content');
      } else {
        metadata.author = element.textContent?.trim();
      }
      if (metadata.author) break;
    }
  }

  // WeChat specific author extraction
  if (window.location.hostname === 'mp.weixin.qq.com') {
    const wechatAuthor = document.querySelector('#js_name, .rich_media_meta_text, .account_nickname_inner');
    if (wechatAuthor) {
      metadata.author = wechatAuthor.textContent?.trim() || metadata.author;
    }
  }

  // Published date extraction (like Obsidian Clipper)
  const publishedSources = [
    'meta[property="article:published_time"]',
    'meta[property="og:article:published_time"]',
    'meta[name="publish_date"]',
    'meta[name="date"]',
    'meta[name="DC.date"]',
    'time[datetime]',
    'time[pubdate]',
    '[datetime]'
  ];

  for (const selector of publishedSources) {
    const element = document.querySelector(selector);
    if (element) {
      let dateValue = element.getAttribute('content') || 
                      element.getAttribute('datetime') || 
                      element.textContent;
      
      if (dateValue) {
        // Try to parse and format the date
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            metadata.published = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            break;
          }
        } catch (e) {
          console.warn('Failed to parse date:', dateValue);
        }
      }
    }
  }

  // WeChat specific publish date
  if (window.location.hostname === 'mp.weixin.qq.com') {
    const wechatTime = document.querySelector('#publish_time, .rich_media_meta_text');
    if (wechatTime && !metadata.published) {
      const timeText = wechatTime.textContent?.trim();
      if (timeText) {
        try {
          const date = new Date(timeText);
          if (!isNaN(date.getTime())) {
            metadata.published = date.toISOString().split('T')[0];
          }
        } catch (e) {
          metadata.published = timeText; // Keep as text if parsing fails
        }
      }
    }
  }

  // Description extraction
  metadata.description = 
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
    '';

  // WeChat specific description
  if (window.location.hostname === 'mp.weixin.qq.com') {
    const wechatDesc = document.querySelector('.rich_media_meta_text');
    if (wechatDesc && !metadata.description) {
      metadata.description = wechatDesc.textContent?.trim() || '';
    }
  }

  // Site name
  metadata.siteName = 
    document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    document.querySelector('meta[name="application-name"]')?.getAttribute('content') ||
    window.location.hostname;

  // Canonical URL
  metadata.canonical = 
    document.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
    document.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
    window.location.href;

  // Language
  metadata.language = 
    document.documentElement.lang ||
    document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content') ||
    'en';

  // Keywords/Tags extraction
  const keywordsEl = document.querySelector('meta[name="keywords"]');
  if (keywordsEl) {
    const keywords = keywordsEl.getAttribute('content');
    if (keywords) {
      metadata.tags = keywords.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
  }

  // Article tags (additional sources)
  const tagSelectors = [
    '.tags a',
    '.tag',
    '.post-tags a', 
    '.article-tags a',
    '[rel="tag"]',
    '.hashtag'
  ];
  
  for (const selector of tagSelectors) {
    const tagElements = document.querySelectorAll(selector);
    if (tagElements.length > 0) {
      const additionalTags = Array.from(tagElements)
        .map(el => el.textContent?.trim())
        .filter(tag => tag && tag.length > 0);
      metadata.tags = [...new Set([...metadata.tags, ...additionalTags])];
      break;
    }
  }

  // Estimate reading time
  const contentText = document.body.textContent || '';
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = contentText.trim().split(/\s+/).length;
  metadata.readingTime = Math.ceil(wordCount / wordsPerMinute);

  // Clean and validate metadata
  Object.keys(metadata).forEach(key => {
    if (typeof metadata[key] === 'string') {
      metadata[key] = metadata[key].trim();
    }
  });

  console.log('✅ Enhanced metadata extracted:', {
    title: metadata.title.substring(0, 50) + '...',
    author: metadata.author,
    published: metadata.published,
    description: metadata.description.substring(0, 100) + '...',
    siteName: metadata.siteName,
    tagsCount: metadata.tags.length,
    readingTime: metadata.readingTime
  });

  return metadata;
}

// Enhanced content extraction with metadata
async function extractArticleWithEnhancedMetadata() {
  try {
    console.log('🚀 Starting enhanced extraction with metadata...');
    
    // First extract metadata
    const metadata = extractEnhancedMetadata(document);
    
    // Then extract content using existing logic
    const article = await extractArticle();
    
    // Merge metadata with article content
    const enhancedArticle = {
      ...article,
      ...metadata,
      // Preserve original fields but enhance with metadata
      title: metadata.title || article.title,
      author: metadata.author || article.author,
      publishTime: metadata.published || article.publishTime,
      digest: metadata.description || article.digest,
      url: metadata.canonical || article.url,
      
      // Additional metadata fields
      siteName: metadata.siteName,
      language: metadata.language,
      tags: metadata.tags,
      readingTime: metadata.readingTime,
      created: metadata.created,
      
      // Enhanced extraction indicator
      extractionMethod: article.extractionMethod + '-enhanced-metadata'
    };

    console.log('🎯 Enhanced article with metadata:', {
      title: enhancedArticle.title.substring(0, 50) + '...',
      author: enhancedArticle.author,
      published: enhancedArticle.publishTime,
      siteName: enhancedArticle.siteName,
      tagsCount: enhancedArticle.tags.length,
      contentLength: enhancedArticle.content.length,
      method: enhancedArticle.extractionMethod
    });

    return enhancedArticle;
    
  } catch (error) {
    console.error('❌ Enhanced extraction failed:', error);
    // Fallback to regular extraction
    return await extractArticle();
  }
}

async function downloadImage(imageUrl, options = {}) {
  try {
    console.log(`🖼️ 开始下载图片: ${imageUrl.substring(0, 80)}...`);
    
    // 添加防盗链headers
    const response = await fetch(imageUrl, {
      headers: {
        'Referer': window.location.href,
        'User-Agent': navigator.userAgent
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log(`📦 图片下载成功: ${Math.round(blob.size / 1024)}KB`);
    
    // 验证是否为图片
    if (!blob.type.startsWith('image/')) {
      throw new Error(`文件类型错误: ${blob.type}, 期望图片类型`);
    }
    
    // 如果启用压缩，处理图片
    if (options.enableCompression) {
      const compressedDataUrl = await compressImage(blob, options);
      console.log(`🗜️ 图片压缩完成`);
      return compressedDataUrl;
    } else {
      // 直接转换为data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
    
  } catch (error) {
    console.error(`❌ 图片下载失败 (${imageUrl}):`, error);
    return null;
  }
}

// 智能图片压缩函数
async function compressImage(blob, options = {}) {
  const {
    quality = 0.8,
    maxWidth = 1200,
    maxHeight = 800,
    format = 'image/jpeg'
  } = options;
  
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        console.log(`📏 调整图片尺寸: ${img.width}x${img.height} → ${width}x${height}`);
      }
      
      // 设置canvas尺寸
      canvas.width = width;
      canvas.height = height;
      
      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height);
      
      // 输出压缩后的图片
      const compressedDataUrl = canvas.toDataURL(format, quality);
      
      // 计算压缩率
      const originalSize = blob.size;
      const compressedSize = Math.round(compressedDataUrl.length * 0.75); // base64大约比原始大33%
      const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
      
      console.log(`🎯 压缩统计: ${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB (压缩${compressionRatio}%)`);
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      console.warn('⚠️ 图片压缩失败，使用原图');
      // 如果压缩失败，返回原图
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    };
    
    // 创建图片对象URL
    img.src = URL.createObjectURL(blob);
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'extract') {
    console.log('Received extract request - using enhanced metadata extraction');
    
    // Use enhanced metadata extraction
    extractArticleWithEnhancedMetadata().then(articleData => {
      console.log('Extracted article data with enhanced metadata:', {
        method: articleData.extractionMethod,
        title: articleData.title,
        author: articleData.author,
        published: articleData.publishTime,
        siteName: articleData.siteName,
        contentLength: articleData.content ? articleData.content.length : 0,
        wordCount: articleData.wordCount,
        imageCount: articleData.images ? articleData.images.length : 0,
        tagsCount: articleData.tags ? articleData.tags.length : 0,
        readingTime: articleData.readingTime
      });
      sendResponse(articleData);
    }).catch(error => {
      console.error('Enhanced extraction failed:', error);
      sendResponse({ error: error.message });
    });
    
    return true; // Keep message channel open for async response
  } else if (msg.type === 'downloadImage') {
    const options = {
      enableCompression: msg.enableCompression || false,
      quality: msg.quality || 0.8,
      maxWidth: msg.maxWidth || 1200,
      maxHeight: msg.maxHeight || 800
    };
    
    downloadImage(msg.url, options).then(dataUrl => {
      if (dataUrl) {
        sendResponse({ success: true, dataUrl });
      } else {
        sendResponse({ success: false, error: '图片下载失败' });
      }
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Add debug information to console
// 辅助函数：验证图片URL是否有效
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // 过滤掉无效的URL类型
  const invalidPrefixes = [
    'data:',                    // base64图片
    'chrome-extension://',      // 浏览器扩展链接
    'moz-extension://',         // Firefox扩展链接
    'chrome://',               // Chrome内部页面
    'about:',                  // 浏览器内部页面
    'javascript:',             // JavaScript代码
    'blob:',                   // Blob URL（通常是临时的）
    'extension://'             // 通用扩展前缀
  ];
  
  // 检查是否是无效前缀
  for (const prefix of invalidPrefixes) {
    if (url.startsWith(prefix)) {
      console.log(`🚫 过滤无效图片链接: ${url.substring(0, 50)}... (${prefix})`);
      return false;
    }
  }
  
  // 检查是否是有效的HTTP(S) URL
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      console.log(`🚫 过滤非HTTP图片链接: ${url.substring(0, 50)}... (${urlObj.protocol})`);
      return false;
    }
  } catch (error) {
    console.log(`🚫 过滤无效URL格式: ${url.substring(0, 50)}...`);
    return false;
  }
  
  return true;
}

console.log('Enhanced Smart Article Extractor content script loaded with Defuddle support');
console.log('Current domain:', window.location.hostname);
console.log('Defuddle available at load:', typeof Defuddle); 