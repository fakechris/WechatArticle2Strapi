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
          <div style="font-size: 12px; line-height: 1.4; color: #6c757d;">
            ${getContentSummary(article.content)}
          </div>
        </div>
        <button class="content-toggle" id="content-toggle-btn">
          📖 Show Full Content
        </button>
      </div>
      
      <div id="content-preview-area" style="display: none;">
        <div class="content-preview">
          <div id="preview-content-container">
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

// 获取内容摘要
function getContentSummary(content) {
  if (!content) return 'No content available';
  
  // 移除HTML标签，获取纯文本
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // 移除脚本和样式
  const scripts = tempDiv.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());
  
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  // 获取前200个字符作为摘要
  let summary = textContent.trim().substring(0, 200);
  
  // 如果内容被截断，添加省略号
  if (textContent.length > 200) {
    // 尝试在句号、问号或感叹号处截断
    const lastSentenceEnd = Math.max(
      summary.lastIndexOf('。'),
      summary.lastIndexOf('！'),
      summary.lastIndexOf('？'),
      summary.lastIndexOf('.'),
      summary.lastIndexOf('!'),
      summary.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > 100) {
      summary = summary.substring(0, lastSentenceEnd + 1);
    } else {
      summary += '...';
    }
  }
  
  return summary || 'No readable content found';
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

// 预览功能
document.getElementById('preview').addEventListener('click', () => {
  updateStatus('Extracting article...');
  setLoading(true);
  
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const currentTab = tabs[0];
    
    // Check if it's a readable web page
    if (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://') || currentTab.url.startsWith('moz-extension://')) {
      updateStatus('Cannot extract content from browser internal pages', true);
      setLoading(false);
      return;
    }
    
    chrome.tabs.sendMessage(currentTab.id, { type: 'extract' }, article => {
      setLoading(false);
      
      if (chrome.runtime.lastError) {
        updateStatus('Failed to extract article: ' + chrome.runtime.lastError.message, true);
        return;
      }
      
      if (!article || !article.title) {
        updateStatus('No article content found. Please try a different web page.', true);
        return;
      }
      
      displayArticlePreview(article);
      updateStatus('Article extracted successfully!');
      
      // 存储文章数据以备发送
      window.currentArticle = article;
    });
  });
});

// 提取并发送功能
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
    
    chrome.tabs.sendMessage(currentTab.id, { type: 'extract' }, article => {
      console.log('=== Extract & Send clicked ===');
      console.log('Extract response:', article);
      
      if (chrome.runtime.lastError) {
        console.error('Content script error:', chrome.runtime.lastError);
        updateStatus('Failed to extract article: ' + chrome.runtime.lastError.message, true);
        setLoading(false);
        return;
      }
      
      if (!article || !article.title) {
        console.error('No article found');
        updateStatus('No article content found', true);
        setLoading(false);
        return;
      }
      
      console.log('Article extracted successfully:', {
        title: article.title,
        contentLength: article.content?.length,
        imageCount: article.images?.length,
        hasDigest: !!article.digest
      });
      
      updateStatus('Sending to Strapi...');
      
      console.log('=== Sending to Background Script ===');
      console.log('Article to send:', {
        title: article.title,
        method: article.extractionMethod,
        contentLength: article.content?.length
      });
      
      chrome.runtime.sendMessage({ type: 'sendToStrapi', article }, response => {
        setLoading(false);
        
        console.log('=== Background Script Response ===');
        console.log('Response received:', response);
        console.log('Chrome runtime error:', chrome.runtime.lastError);
        
        if (chrome.runtime.lastError) {
          console.error('Communication error details:', chrome.runtime.lastError);
          updateStatus('Communication error: ' + chrome.runtime.lastError.message, true);
          return;
        }
        
        if (response && response.success) {
          console.log('Upload successful, response data:', response.data);
          updateStatus('Successfully uploaded to Strapi!');
          // 显示成功详情
          if (response.data && response.data.id) {
            const createdId = response.data.id;
            console.log('Article ID from response:', createdId);
            updateStatus(`Successfully uploaded! Article ID: ${createdId}`);
          }
        } else {
          console.error('Upload failed, response:', response);
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

// 🔥 新增：调试Strapi配置状态
function debugStrapiConfig() {
  chrome.storage.sync.get(['strapiUrl', 'token', 'collection', 'fieldMapping', 'advancedSettings'], (data) => {
    console.log('🔍 Strapi配置调试信息:');
    console.log('Strapi URL:', data.strapiUrl || '未配置');
    console.log('Collection:', data.collection || '未配置');
    console.log('Token存在:', !!data.token);
    console.log('Token长度:', data.token ? data.token.length : 0);
    console.log('Token前缀:', data.token ? data.token.substring(0, 20) + '...' : '无');
    
    // 检查Token格式
    if (data.token) {
      const isJWT = data.token.includes('.');
      console.log('Token格式:', isJWT ? 'JWT' : 'Simple Token');
      
      if (isJWT) {
        try {
          const parts = data.token.split('.');
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
    
    console.log('字段映射配置:', data.fieldMapping ? '已配置' : '未配置');
    console.log('高级设置:', data.advancedSettings ? '已配置' : '未配置');
    
    // 测试API连接
    if (data.strapiUrl && data.token && data.collection) {
      console.log('正在测试API连接...');
      testStrapiConnection(data);
    } else {
      console.warn('⚠️ 配置不完整，无法测试连接');
    }
  });
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 检查配置状态
  chrome.storage.sync.get(['strapiUrl', 'token', 'collection'], (data) => {
    if (!data.strapiUrl || !data.token || !data.collection) {
      updateStatus('Please configure Strapi settings first', true);
      document.getElementById('config-warning').style.display = 'block';
    }
    
    // 🔥 自动运行调试
    console.log('🔧 运行Strapi配置调试...');
    debugStrapiConfig();
  });
  
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
