/******/ (() => { // webpackBootstrap
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
  
  previewEl.innerHTML = `
    <h3>${article.title || 'No Title'}</h3>
    <div style="margin: 10px 0;">${extractionBadge}</div>
    <p><strong>Author:</strong> ${article.author || 'Unknown'}</p>
    <p><strong>Publish Time:</strong> ${article.publishTime || 'Unknown'}</p>
    <p><strong>Digest:</strong> ${article.digest || 'No digest'}</p>
    <p><strong>Images:</strong> ${article.images ? article.images.length : 0}</p>
    <p><strong>Content Length:</strong> ${article.content ? article.content.length : 0} characters</p>
    ${article.wordCount ? `<p><strong>Word Count:</strong> ${article.wordCount}</p>` : ''}
    ${article.domain ? `<p><strong>Domain:</strong> ${article.domain}</p>` : ''}
    ${article.parseTime ? `<p><strong>Parse Time:</strong> ${article.parseTime}ms</p>` : ''}
    <details style="margin-top: 10px;">
      <summary style="cursor: pointer; font-weight: bold;">Debug Info</summary>
      <pre style="font-size: 10px; background: #f5f5f5; padding: 5px; border-radius: 3px; margin-top: 5px; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">${JSON.stringify({...article, content: article.content ? article.content.substring(0, 500) + '...[truncated]' : ''}, null, 2)}</pre>
    </details>
  `;
  document.getElementById('preview-section').style.display = 'block';
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 检查配置状态
  chrome.storage.sync.get(['strapiUrl', 'token', 'collection'], (data) => {
    if (!data.strapiUrl || !data.token || !data.collection) {
      updateStatus('Please configure Strapi settings first', true);
      document.getElementById('config-warning').style.display = 'block';
    }
  });
});

/******/ })()
;