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
  previewEl.innerHTML = `
    <h3>${article.title || 'No Title'}</h3>
    <p><strong>Author:</strong> ${article.author || 'Unknown'}</p>
    <p><strong>Publish Time:</strong> ${article.publishTime || 'Unknown'}</p>
    <p><strong>Digest:</strong> ${article.digest || 'No digest'}</p>
    <p><strong>Images:</strong> ${article.images ? article.images.length : 0}</p>
    <p><strong>Content Length:</strong> ${article.content ? article.content.length : 0} characters</p>
    <details style="margin-top: 10px;">
      <summary style="cursor: pointer; font-weight: bold;">Debug Info</summary>
      <pre style="font-size: 10px; background: #f5f5f5; padding: 5px; border-radius: 3px; margin-top: 5px; white-space: pre-wrap;">${JSON.stringify(article, null, 2)}</pre>
    </details>
  `;
  document.getElementById('preview-section').style.display = 'block';
}

// 预览功能
document.getElementById('preview').addEventListener('click', () => {
  updateStatus('Extracting article...');
  setLoading(true);
  
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const currentTab = tabs[0];
    
    // 检查是否为微信文章页面
    if (!currentTab.url.includes('mp.weixin.qq.com')) {
      updateStatus('Please open a WeChat article page first', true);
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
        updateStatus('No article content found. Please make sure you are on a WeChat article page.', true);
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
    
    // 检查是否为微信文章页面
    if (!currentTab.url.includes('mp.weixin.qq.com')) {
      updateStatus('Please open a WeChat article page first', true);
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
      
      chrome.runtime.sendMessage({ type: 'sendToStrapi', article }, response => {
        setLoading(false);
        
        if (chrome.runtime.lastError) {
          updateStatus('Communication error: ' + chrome.runtime.lastError.message, true);
          return;
        }
        
        if (response && response.success) {
          updateStatus('Successfully uploaded to Strapi!');
          // 显示成功详情
          if (response.data && response.data.data) {
            const createdId = response.data.data.id;
            updateStatus(`Successfully uploaded! Article ID: ${createdId}`);
          }
        } else {
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
