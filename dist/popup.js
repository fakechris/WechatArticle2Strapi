/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
function updateStatus(message, isError = false) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = isError ? 'error' : 'success';
}

function setLoading(isLoading) {
  const extractBtn = document.getElementById('extract');
  const previewBtn = document.getElementById('preview');
  
  extractBtn.disabled = isLoading;
  previewBtn.disabled = isLoading;
  
  if (isLoading) {
    extractBtn.textContent = 'Processing...';
  } else {
    extractBtn.textContent = 'Extract & Send';
  }
}

function displayArticlePreview(article) {
  const previewEl = document.getElementById('preview-content');
  
  // Create extraction method badge
  const extractionBadge = getExtractionBadge(article.extractionMethod);
  
  // Process content for preview
  const sanitizedData = sanitizeContentForPreview(article.content);
  const contentLength = article.content ? article.content.length : 0;
  const wordCount = article.wordCount || estimateWordCount(article.content);
  
  // Create stats
  const stats = [
    { label: 'Characters', value: contentLength },
    { label: 'Words', value: wordCount },
    { label: 'Images', value: article.images ? article.images.length : 0 }
  ];
  
  if (article.parseTime) {
    stats.push({ label: 'Parse Time', value: `${article.parseTime}ms` });
  }
  
  const statsHtml = stats.map(stat => 
    `<div class="stat-item"><strong>${stat.value}</strong> ${stat.label}</div>`
  ).join('');
  
  previewEl.innerHTML = `
    <h3>${article.title || 'No Title'}</h3>
    <div style="margin: 10px 0;">${extractionBadge}</div>
    
    <div class="content-stats">
      ${statsHtml}
    </div>
    
    ${article.author ? `<p><strong>Author:</strong> ${article.author}</p>` : ''}
    ${article.publishTime ? `<p><strong>Publish Time:</strong> ${article.publishTime}</p>` : ''}
    ${article.digest ? `<p><strong>Digest:</strong> ${article.digest}</p>` : ''}
    ${article.slug ? `<p><strong>Slug:</strong> <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-size: 11px; font-family: monospace;">${article.slug}</code></p>` : ''}
    ${article.domain ? `<p><strong>Domain:</strong> ${article.domain}</p>` : ''}
    
    ${contentLength > 0 ? `
      <div style="margin: 10px 0;">
        <div style="background: white; border: 1px solid #e1e5e9; border-radius: 4px; padding: 10px; margin: 8px 0;">
          <div style="font-weight: bold; font-size: 12px; color: #495057; margin-bottom: 6px;">📖 Content Preview</div>
          <div style="font-size: 12px; line-height: 1.6; color: #333; max-height: 300px; overflow-y: auto;">
            <div class="content-preview-summary">
              ${getContentSummary(article.content)}
            </div>
          </div>
        </div>
        <button class="content-toggle" id="content-toggle-btn">
          📖 Show Full Content
        </button>
      </div>
      
      <div id="content-preview-area" style="display: none;">
        <div class="content-preview">
          <div id="preview-content-container" style="
            background: white; 
            border: 1px solid #e1e5e9; 
            border-radius: 4px; 
            padding: 15px; 
            margin: 10px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
            max-height: 500px;
            overflow-y: auto;
          ">
            ${sanitizedData.content}
          </div>
          ${sanitizedData.isTruncated ? `
            <div style="text-align: center; margin-top: 15px; padding: 10px; background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 4px;">
              <p style="margin: 5px 0; color: #0066cc; font-size: 12px;">
                ⚠️ 内容已截断显示（当前显示: 10,000 字符，总长度: ${sanitizedData.fullLength.toLocaleString()} 字符）
              </p>
              <button id="show-full-content-btn" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                显示完整内容
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    ` : `
      <div style="margin: 10px 0; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24; font-size: 12px;">
        ⚠️ No content extracted from this page
      </div>
    `}
    
    ${article.images && article.images.length > 0 ? `
      <details style="margin-top: 10px;">
        <summary style="cursor: pointer; font-weight: bold; font-size: 12px;">📷 Images (${article.images.length})</summary>
        <div style="margin-top: 8px;">
          ${article.images.slice(0, 3).map(img => `
            <div style="margin: 5px 0; padding: 5px; background: white; border-radius: 3px; font-size: 11px;">
              <div><strong>Source:</strong> ${truncateText(img.src, 50)}</div>
              ${img.alt ? `<div><strong>Alt:</strong> ${truncateText(img.alt, 40)}</div>` : ''}
            </div>
          `).join('')}
          ${article.images.length > 3 ? `<p style="font-size: 11px; color: #6c757d;">... and ${article.images.length - 3} more images</p>` : ''}
        </div>
      </details>
    ` : ''}
    
    <details style="margin-top: 10px;">
      <summary style="cursor: pointer; font-weight: bold; font-size: 12px;">🔧 Debug Info</summary>
      <pre style="font-size: 10px; background: #f5f5f5; padding: 5px; border-radius: 3px; margin-top: 5px; white-space: pre-wrap; max-height: 150px; overflow-y: auto;">${JSON.stringify({...article, content: article.content ? `[${article.content.length} characters]` : ''}, null, 2)}</pre>
    </details>
  `;
  document.getElementById('preview-section').style.display = 'block';
  
  // 事件已通过全局事件委托处理，无需额外绑定
}

// 切换内容预览的函数
function toggleContentPreview() {
  const previewArea = document.getElementById('content-preview-area');
  const toggleBtn = document.getElementById('content-toggle-btn');
  
  if (previewArea && toggleBtn) {
    if (previewArea.style.display === 'none') {
      previewArea.style.display = 'block';
      toggleBtn.textContent = '📖 Hide Full Content';
    } else {
      previewArea.style.display = 'none';
      toggleBtn.textContent = '📖 Show Full Content';
    }
  }
}

// 显示完整内容的函数
function showFullContent() {
  if (window.currentArticle && window.currentArticle.content) {
    const container = document.getElementById('preview-content-container');
    const showBtn = document.getElementById('show-full-content-btn');
    
    if (container && showBtn) {
      // 显示完整内容（不截断）
      const fullData = sanitizeContentForPreview(window.currentArticle.content, false);
      container.innerHTML = fullData.content;
      
      // 隐藏按钮和警告信息
      showBtn.parentElement.style.display = 'none';
      
      // 显示加载完成提示
      const successMsg = document.createElement('div');
      successMsg.style.cssText = 'text-align: center; margin-top: 10px; padding: 8px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724; font-size: 12px;';
      successMsg.innerHTML = '✅ 完整内容已加载完成';
      container.parentElement.appendChild(successMsg);
      
      // 3秒后自动隐藏成功提示
      setTimeout(() => {
        if (successMsg.parentElement) {
          successMsg.parentElement.removeChild(successMsg);
        }
      }, 3000);
    }
  }
}

// 获取内容摘要（保留HTML格式）
function getContentSummary(content) {
  if (!content) return 'No content available';
  
  // 创建临时div来处理HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // 移除脚本和样式标签
  const scripts = tempDiv.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());
  
  // 获取带格式的HTML内容
  let htmlContent = tempDiv.innerHTML;
  
  // 如果内容太长，智能截断（尝试在完整标签处截断）
  if (htmlContent.length > 800) {
    const truncated = htmlContent.substring(0, 800);
    
    // 尝试在最后一个完整的HTML标签处截断
    const lastCompleteTag = truncated.lastIndexOf('</');
    if (lastCompleteTag > 400) {
      // 找到对应的标签结束位置
      const tagEnd = truncated.indexOf('>', lastCompleteTag);
      if (tagEnd !== -1) {
        htmlContent = truncated.substring(0, tagEnd + 1) + '...';
      } else {
        htmlContent = truncated + '...';
      }
    } else {
      // 如果找不到完整标签，在句号、问号或感叹号处截断
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('。'),
        truncated.lastIndexOf('！'),
        truncated.lastIndexOf('？'),
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
      );
      
      if (lastSentenceEnd > 400) {
        htmlContent = truncated.substring(0, lastSentenceEnd + 1) + '...';
      } else {
        htmlContent = truncated + '...';
      }
    }
  }
  
  return htmlContent || 'No readable content found';
}

// 净化内容用于预览显示
function sanitizeContentForPreview(content, truncate = true) {
  if (!content) return { content: '', isTruncated: false, fullLength: 0 };
  
  // 创建临时div来处理HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // 移除脚本和样式标签
  const scripts = tempDiv.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());
  
  let processedContent = tempDiv.innerHTML;
  const fullLength = processedContent.length;
  let isTruncated = false;
  
  // 如果内容太长且需要截断，截取前面部分
  if (truncate && processedContent.length > 10000) {
    processedContent = processedContent.substring(0, 10000);
    isTruncated = true;
  }
  
  return { 
    content: processedContent, 
    isTruncated: isTruncated, 
    fullLength: fullLength 
  };
}

// 估算字数
function estimateWordCount(content) {
  if (!content) return 0;
  
  // 移除HTML标签
  const textContent = content.replace(/<[^>]*>/g, '');
  
  // 分割单词（支持中英文）
  const words = textContent.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g);
  return words ? words.length : 0;
}

// 截断文本
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function getExtractionBadge(method) {
  const badges = {
    'defuddle': '<span style="background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">✨ Defuddle Enhanced</span>',
    'defuddle-enhanced-wechat': '<span style="background: #2196F3; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">🎯 Defuddle + WeChat</span>',
    'wechat-fallback': '<span style="background: #FF9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">📱 WeChat Selectors</span>',
    'basic-fallback': '<span style="background: #757575; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">⚠️ Basic Extraction</span>'
  };
  return badges[method] || '<span style="background: #757575; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">❓ Unknown</span>';
}

// 预览功能 - 使用和Extract相同的完整提取逻辑
document.getElementById('preview').addEventListener('click', () => {
  console.log('=== Preview按钮点击 ===');
  updateStatus('Extracting article...');
  setLoading(true);
  
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const currentTab = tabs[0];
    console.log('当前标签页:', {
      url: currentTab.url,
      title: currentTab.title,
      id: currentTab.id
    });
    
    // Check if it's a readable web page
    if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://') || currentTab.url.startsWith('moz-extension://')) {
      console.warn('❌ 无法从浏览器内部页面提取内容');
      updateStatus('Cannot extract content from browser internal pages', true);
      setLoading(false);
      return;
    }
    
    console.log('📤 发送Preview请求到background script（使用完整提取逻辑）');
    // 使用和Extract相同的完整逻辑，但是不上传到Strapi
    chrome.runtime.sendMessage({ 
      type: 'previewArticle',  // 新的消息类型
      tabId: currentTab.id 
    }, response => {
      setLoading(false);
      
      console.log('📨 Preview响应接收:', {
        hasError: !!chrome.runtime.lastError,
        errorMessage: chrome.runtime.lastError?.message,
        hasResponse: !!response,
        success: response?.success
      });
      
      if (chrome.runtime.lastError) {
        console.error('Background script通信错误:', chrome.runtime.lastError);
        updateStatus('Failed to extract article: ' + chrome.runtime.lastError.message, true);
        return;
      }
      
      if (!response || !response.success || !response.data) {
        console.warn('❌ 没有找到文章内容');
        const errorMsg = response?.error || 'No article content found';
        updateStatus('Failed to extract: ' + errorMsg, true);
        return;
      }
      
      const article = response.data;
      console.log('✅ Preview提取成功:', {
        title: article.title,
        contentLength: article.content?.length || 0,
        method: article.extractionMethod
      });
      
      displayArticlePreview(article);
      updateStatus('Article extracted successfully! (Preview mode - not uploaded)');
      
      // 存储文章数据以备发送
      window.currentArticle = article;
    });
  });
});

// 提取并发送功能 - 🔥 重构：使用和Preview相同的完整提取逻辑
document.getElementById('extract').addEventListener('click', () => {
  updateStatus('Extracting and sending...');
  setLoading(true);
  
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const currentTab = tabs[0];
    
    // Check if it's a readable web page
    if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://') || currentTab.url.startsWith('moz-extension://')) {
      updateStatus('Cannot extract content from browser internal pages', true);
      setLoading(false);
      return;
    }
    
    console.log('=== Extract & Send 开始 ===');
    console.log('当前标签页:', {
      url: currentTab.url,
      title: currentTab.title,
      id: currentTab.id
    });
    
    // 🎯 使用和Preview相同的完整提取逻辑
    chrome.tabs.sendMessage(currentTab.id, { 
      type: 'FULL_EXTRACT',  // 🔥 改为使用完整提取
      options: {
        includeFullContent: true,
        includeImages: true,
        includeMetadata: true
      }
    }, response => {
      console.log('=== Content Script 响应 ===');
      console.log('Extract response:', {
        hasResponse: !!response,
        responseType: typeof response,
        hasSuccess: !!(response && response.success),
        hasData: !!(response && response.data),
        directTitle: response?.title,
        dataTitle: response?.data?.title
      });
      
      if (chrome.runtime.lastError) {
        console.error('Content script error:', chrome.runtime.lastError);
        updateStatus('Failed to extract article: ' + chrome.runtime.lastError.message, true);
        setLoading(false);
        return;
      }
      
      // 🎯 处理不同响应格式（和Preview一致）
      let article = null;
      if (response && response.success && response.data) {
        article = response.data;
        console.log('✅ 使用包装格式数据');
      } else if (response && response.title) {
        article = response;
        console.log('✅ 使用直接格式数据');
      }
      
      if (!article || !article.title) {
        console.error('No article found:', {
          hasArticle: !!article,
          articleKeys: article ? Object.keys(article) : [],
          title: article?.title
        });
        updateStatus('No article content found', true);
        setLoading(false);
        return;
      }
      
      console.log('✅ 文章提取成功:', {
        title: article.title,
        author: article.author,
        siteName: article.siteName,
        digest: article.digest,
        contentLength: article.content?.length,
        imageCount: article.images?.length,
        extractionMethod: article.extractionMethod,
        hasDigest: !!article.digest
      });
      
      updateStatus('Sending to Strapi...');
      
      console.log('=== 🎯 发送到Background Script (使用完整数据) ===');
      console.log('Article to send:', {
        title: article.title,
        author: article.author,
        siteName: article.siteName,
        digest: article.digest,
        method: article.extractionMethod,
        contentLength: article.content?.length,
        allKeys: Object.keys(article)
      });
      
      chrome.runtime.sendMessage({ type: 'sendToStrapi', article }, response => {
        setLoading(false);
        
        console.log('=== Background Script 响应 ===');
        console.log('Response received:', response);
        console.log('Chrome runtime error:', chrome.runtime.lastError);
        
        if (chrome.runtime.lastError) {
          console.error('Communication error details:', chrome.runtime.lastError);
          updateStatus('Communication error: ' + chrome.runtime.lastError.message, true);
          return;
        }
        
        if (response && response.success) {
          console.log('✅ 上传成功, response data:', response.data);
          updateStatus('Successfully uploaded to Strapi!');
          // 显示成功详情
          if (response.data && response.data.id) {
            const createdId = response.data.id;
            console.log('Article ID from response:', createdId);
            updateStatus(`Successfully uploaded! Article ID: ${createdId}`);
          }
        } else {
          console.error('❌ 上传失败, response:', response);
          const errorMsg = response && response.error ? response.error : 'Unknown error occurred';
          updateStatus('Upload failed: ' + errorMsg, true);
        }
      });
    });
  });
});

// 打开选项页面
document.getElementById('options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// 🔥 新增：调试Strapi配置状态（使用统一配置读取）
async function debugStrapiConfig() {
  try {
    // 使用和background script相同的统一配置读取逻辑
    const config = await loadUnifiedConfig();
    
    console.log('🔍 统一Strapi配置调试信息:');
    console.log('Strapi URL:', config.strapiUrl || '未配置');
    console.log('Collection:', config.collection || '未配置');
    console.log('Token存在:', !!config.token);
    console.log('Token长度:', config.token ? config.token.length : 0);
    console.log('Token前缀:', config.token ? config.token.substring(0, 20) + '...' : '无');
    console.log('字段映射启用:', config.fieldMapping?.enabled || false);
    console.log('字段映射字段数量:', Object.keys(config.fieldMapping?.fields || {}).length);
    console.log('高级设置存在:', !!config.advancedSettings);
    console.log('配置环境:', 'chrome-extension');
    
    // 检查Token格式
    if (config.token) {
      const isJWT = config.token.includes('.');
      console.log('Token格式:', isJWT ? 'JWT' : 'Simple Token');
      
      if (isJWT) {
        try {
          const parts = config.token.split('.');
          console.log('JWT部分数量:', parts.length);
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1]));
            console.log('JWT载荷:', payload);
            if (payload.exp) {
              const expDate = new Date(payload.exp * 1000);
              const now = new Date();
              console.log('JWT过期时间:', expDate.toISOString());
              console.log('当前时间:', now.toISOString());
              console.log('Token是否过期:', now > expDate);
            }
          }
        } catch (jwtError) {
          console.error('JWT解析错误:', jwtError.message);
        }
      }
    }
    
    // 验证配置
    const validation = validateUnifiedConfig(config);
    console.log('配置验证结果:', {
      valid: validation.valid,
      errors: validation.errors
    });
    
    // 测试API连接
    if (validation.valid) {
      console.log('正在测试API连接...');
      testStrapiConnection(config);
    } else {
      console.warn('⚠️ 配置无效，无法测试连接:', validation.errors);
    }
    
  } catch (error) {
    console.error('❌ 配置调试失败:', error);
  }
}

// 统一的配置读取逻辑（与background.js一致）
async function loadUnifiedConfig() {
  return new Promise((resolve, reject) => {
    const configKeys = [
      'strapiUrl', 'token', 'collection', 
      'fieldMapping', 'fieldPresets', 'advancedSettings',
      'enableCleanupRules', 'customCleanupRules'
    ];

    chrome.storage.sync.get(configKeys, (data) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // 标准化配置，确保包含所有默认值（与CLI一致）
      const normalizedConfig = normalizeUnifiedConfig(data);
      resolve(normalizedConfig);
    });
  });
}

// 标准化配置对象（与background.js一致）
function normalizeUnifiedConfig(userConfig = {}) {
  const defaultConfig = getUnifiedDefaultConfig();
  return deepMergeUnifiedConfig(defaultConfig, userConfig);
}

// 获取默认配置（与background.js一致）
function getUnifiedDefaultConfig() {
  return {
    strapiUrl: '',
    token: '',
    collection: 'articles',
    fieldMapping: {
      enabled: false,
      fields: {
        title: 'title',
        content: 'content',
        author: 'author',
        publishTime: 'publishTime',
        digest: 'digest',
        sourceUrl: 'sourceUrl',
        images: 'images',
        slug: 'slug',
        siteName: 'siteName',
        language: 'language',
        tags: 'tags',
        readingTime: 'readingTime',
        created: 'extractedAt',
        headImg: 'head_img'
      }
    },
    fieldPresets: {
      enabled: false,
      presets: {}
    },
    advancedSettings: {
      maxContentLength: 50000,
      maxImages: 10,
      generateSlug: true,
      uploadImages: true,
      sanitizeContent: true,
      includeBlocksField: false,
      putContentInBlocks: false,
      blocksComponentName: 'blocks.rich-text',
      enableImageCompression: true,
      imageQuality: 0.8,
      maxImageWidth: 1200,
      maxImageHeight: 800,
      smartImageReplace: true,
      retryFailedImages: true,
      uploadHeadImg: false,
      headImgIndex: 0
    },
    enableCleanupRules: true,
    customCleanupRules: []
  };
}

// 深度合并配置对象（与background.js一致）
function deepMergeUnifiedConfig(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isUnifiedObject(source[key]) && isUnifiedObject(result[key])) {
        result[key] = deepMergeUnifiedConfig(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

// 检查是否为对象（与background.js一致）
function isUnifiedObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// 验证统一配置有效性（与background.js一致）
function validateUnifiedConfig(config) {
  const errors = [];

  if (!config) {
    errors.push('Configuration is required');
    return { valid: false, errors };
  }

  if (!config.strapiUrl) {
    errors.push('Strapi URL is required');
  } else {
    try {
      new URL(config.strapiUrl);
    } catch {
      errors.push('Invalid Strapi URL format');
    }
  }

  if (!config.token) {
    errors.push('Strapi API token is required');
  }

  if (!config.collection) {
    errors.push('Strapi collection name is required');
  }

  if (config.fieldMapping && config.fieldMapping.enabled) {
    if (!config.fieldMapping.fields) {
      errors.push('Field mapping is enabled but no fields are defined');
    } else {
      const requiredFields = ['title', 'content'];
      for (const field of requiredFields) {
        if (!config.fieldMapping.fields[field]) {
          errors.push(`Required field mapping missing: ${field}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 🔥 新增：测试Strapi连接
async function testStrapiConnection(config) {
  try {
    const testUrl = `${config.strapiUrl}/api/${config.collection}`;
    console.log('测试URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API测试结果:');
    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.error('🚨 401错误 - 认证失败！');
      console.error('可能的原因:');
      console.error('1. Token无效或过期');
      console.error('2. Token权限不足');
      console.error('3. Strapi URL错误');
      console.error('4. Collection名称错误');
      
      try {
        const errorText = await response.text();
        console.error('错误详情:', errorText);
      } catch (e) {
        console.error('无法读取错误详情');
      }
    } else if (response.ok) {
      console.log('✅ API连接测试成功');
      const data = await response.json();
      console.log('返回数据:', data);
    } else {
      console.error('❌ API连接测试失败');
      const errorText = await response.text();
      console.error('错误信息:', errorText);
    }
  } catch (error) {
    console.error('🔥 连接测试异常:', error);
  }
}

// 初始化（使用统一配置读取）
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 使用统一的配置读取逻辑检查配置状态
    const config = await loadUnifiedConfig();
    
    console.log('🚀 Popup初始化，使用统一配置逻辑');
    
    // 验证配置
    const validation = validateUnifiedConfig(config);
    
    if (!validation.valid) {
      updateStatus('Please configure Strapi settings first: ' + validation.errors.join(', '), true);
      document.getElementById('config-warning').style.display = 'block';
      console.warn('⚠️ 配置验证失败:', validation.errors);
    } else {
      console.log('✅ 配置验证通过');
      // 隐藏配置警告（如果存在）
      const warningElement = document.getElementById('config-warning');
      if (warningElement) {
        warningElement.style.display = 'none';
      }
    }
    
    // 🔥 自动运行统一配置调试
    console.log('🔧 运行统一Strapi配置调试...');
    await debugStrapiConfig();
    
  } catch (error) {
    console.error('❌ Popup初始化失败:', error);
    updateStatus('Failed to load configuration: ' + error.message, true);
    document.getElementById('config-warning').style.display = 'block';
  }
  
  // 使用事件委托来处理动态生成的按钮点击
  // 这是一个更安全的方法，避免CSP问题
  document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'content-toggle-btn') {
      event.preventDefault();
      toggleContentPreview();
    }
    
    // 处理显示完整内容按钮
    if (event.target && event.target.id === 'show-full-content-btn') {
      event.preventDefault();
      showFullContent();
    }
  });
});

/******/ })()
;