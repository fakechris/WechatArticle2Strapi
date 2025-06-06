function updateStatus(message, isError = false) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = isError ? 'error' : 'success';
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateForm() {
  const strapiUrl = document.getElementById('strapiUrl').value.trim();
  const token = document.getElementById('token').value.trim();
  const collection = document.getElementById('collection').value.trim();
  
  if (!strapiUrl) {
    updateStatus('Strapi URL is required', true);
    return false;
  }
  
  if (!validateUrl(strapiUrl)) {
    updateStatus('Please enter a valid URL (including https://)', true);
    return false;
  }
  
  if (!token) {
    updateStatus('API Token is required', true);
    return false;
  }
  
  if (!collection) {
    updateStatus('Collection name is required', true);
    return false;
  }
  
  // 验证collection名称格式
  if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(collection)) {
    updateStatus('Collection name should start with a letter and contain only letters, numbers, hyphens, and underscores', true);
    return false;
  }
  
  return true;
}

function getFieldMapping() {
  const useFieldMapping = document.getElementById('useFieldMapping').checked;
  
  if (!useFieldMapping) {
    return {
      enabled: false,
      fields: {}
    };
  }
  
  return {
    enabled: true,
    fields: {
      title: document.getElementById('titleField').value.trim() || 'title',
      content: document.getElementById('contentField').value.trim(),
      author: document.getElementById('authorField').value.trim(),
      publishTime: document.getElementById('publishTimeField').value.trim(),
      digest: document.getElementById('digestField').value.trim(),
      sourceUrl: document.getElementById('sourceUrlField').value.trim(),
      images: document.getElementById('imagesField').value.trim(),
      slug: document.getElementById('slugField').value.trim() || 'slug'
    }
  };
}

function getAdvancedSettings() {
  return {
    maxContentLength: parseInt(document.getElementById('maxContentLength').value) || 50000,
    maxImages: parseInt(document.getElementById('maxImages').value) || 10,
    generateSlug: document.getElementById('generateSlug').checked,
    uploadImages: document.getElementById('uploadImages').checked,
    sanitizeContent: document.getElementById('sanitizeContent').checked,
    includeBlocksField: document.getElementById('includeBlocksField').checked,
    putContentInBlocks: document.getElementById('putContentInBlocks').checked,
    blocksComponentName: document.getElementById('blocksComponentName').value.trim() || 'blocks.rich-text'
  };
}

function load() {
  const defaultSettings = {
    strapiUrl: '',
    token: '',
    collection: 'articles',
    fieldMapping: {
      enabled: false,
      fields: {
        title: 'title',
        content: '',
        author: '',
        publishTime: '',
        digest: '',
        sourceUrl: '',
        images: '',
        slug: 'slug'
      }
    },
    advancedSettings: {
      maxContentLength: 50000,
      maxImages: 10,
      generateSlug: true,
      uploadImages: true,
      sanitizeContent: true,
      includeBlocksField: true,
      putContentInBlocks: false,
      blocksComponentName: 'blocks.rich-text'
    }
  };
  
  chrome.storage.sync.get(Object.keys(defaultSettings), data => {
    // 基本配置
    document.getElementById('strapiUrl').value = data.strapiUrl || defaultSettings.strapiUrl;
    document.getElementById('token').value = data.token || defaultSettings.token;
    document.getElementById('collection').value = data.collection || defaultSettings.collection;
    
    // 字段映射配置
    const fieldMapping = data.fieldMapping || defaultSettings.fieldMapping;
    document.getElementById('useFieldMapping').checked = fieldMapping.enabled;
    
    if (fieldMapping.enabled) {
      document.getElementById('fieldMappingConfig').style.display = 'block';
    }
    
    document.getElementById('titleField').value = fieldMapping.fields.title || 'title';
    document.getElementById('contentField').value = fieldMapping.fields.content || '';
    document.getElementById('authorField').value = fieldMapping.fields.author || '';
    document.getElementById('publishTimeField').value = fieldMapping.fields.publishTime || '';
    document.getElementById('digestField').value = fieldMapping.fields.digest || '';
    document.getElementById('sourceUrlField').value = fieldMapping.fields.sourceUrl || '';
    document.getElementById('imagesField').value = fieldMapping.fields.images || '';
    document.getElementById('slugField').value = fieldMapping.fields.slug || 'slug';
    
    // 高级设置
    const advancedSettings = data.advancedSettings || defaultSettings.advancedSettings;
    document.getElementById('maxContentLength').value = advancedSettings.maxContentLength;
    document.getElementById('maxImages').value = advancedSettings.maxImages;
    document.getElementById('generateSlug').checked = advancedSettings.generateSlug;
    document.getElementById('uploadImages').checked = advancedSettings.uploadImages;
    document.getElementById('sanitizeContent').checked = advancedSettings.sanitizeContent;
    document.getElementById('includeBlocksField').checked = advancedSettings.includeBlocksField;
    document.getElementById('putContentInBlocks').checked = advancedSettings.putContentInBlocks;
    document.getElementById('blocksComponentName').value = advancedSettings.blocksComponentName;
    
    // 初始化显示状态
    toggleBlocksConfig();
  });
}

function save() {
  if (!validateForm()) {
    return;
  }
  
  const data = {
    strapiUrl: document.getElementById('strapiUrl').value.trim().replace(/\/$/, ''), // 移除尾部斜杠
    token: document.getElementById('token').value.trim(),
    collection: document.getElementById('collection').value.trim(),
    fieldMapping: getFieldMapping(),
    advancedSettings: getAdvancedSettings()
  };
  
  // 显示保存中状态
  document.getElementById('save').disabled = true;
  document.getElementById('save').textContent = 'Saving...';
  
  chrome.storage.sync.set(data, () => {
    document.getElementById('save').disabled = false;
    document.getElementById('save').textContent = 'Save Settings';
    
    if (chrome.runtime.lastError) {
      updateStatus('Failed to save: ' + chrome.runtime.lastError.message, true);
    } else {
      updateStatus('Settings saved successfully!');
      
      // 可选：测试连接
      testConnection(data);
    }
  });
}

async function testConnection(config) {
  try {
    updateStatus('Testing connection...');
    
    const response = await fetch(`${config.strapiUrl}/api/${config.collection}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.token}`
      }
    });
    
    if (response.ok) {
      updateStatus('Settings saved and connection test successful!');
    } else if (response.status === 401) {
      updateStatus('Settings saved, but API token appears to be invalid', true);
    } else if (response.status === 404) {
      updateStatus('Settings saved, but collection might not exist', true);
    } else {
      updateStatus(`Settings saved, but connection test failed (${response.status})`, true);
    }
  } catch (error) {
    updateStatus('Settings saved, but could not test connection', true);
  }
}

// 切换字段映射配置显示
function toggleFieldMapping() {
  const useFieldMapping = document.getElementById('useFieldMapping').checked;
  const configSection = document.getElementById('fieldMappingConfig');
  
  if (useFieldMapping) {
    configSection.style.display = 'block';
  } else {
    configSection.style.display = 'none';
  }
}

// 切换blocks配置显示
function toggleBlocksConfig() {
  const putContentInBlocks = document.getElementById('putContentInBlocks').checked;
  const configSection = document.getElementById('blocksComponentConfig');
  
  if (putContentInBlocks) {
    configSection.style.display = 'flex';
  } else {
    configSection.style.display = 'none';
  }
}

// 实时验证
document.getElementById('strapiUrl').addEventListener('blur', function() {
  const url = this.value.trim();
  if (url && !validateUrl(url)) {
    updateStatus('Please enter a valid URL (including https://)', true);
  }
});

document.getElementById('collection').addEventListener('blur', function() {
  const collection = this.value.trim();
  if (collection && !/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(collection)) {
    updateStatus('Collection name should start with a letter and contain only letters, numbers, hyphens, and underscores', true);
  }
});

// 字段映射切换事件
document.getElementById('useFieldMapping').addEventListener('change', toggleFieldMapping);

// blocks配置切换事件
document.getElementById('putContentInBlocks').addEventListener('change', toggleBlocksConfig);

// 调试功能：显示当前设置
function debugSettings() {
  chrome.storage.sync.get(null, (data) => {
    const debugOutput = document.getElementById('debugOutput');
    debugOutput.style.display = 'block';
    debugOutput.innerHTML = '<strong>Current Settings:</strong><br>' + JSON.stringify(data, null, 2);
    console.log('Current settings:', data);
  });
}

// 测试数据生成：模拟validateArticleData函数
function testDataGeneration() {
  chrome.storage.sync.get(null, (data) => {
    // 模拟文章数据
    const mockArticle = {
      title: "Test Article",
      content: "This is test content for debugging purposes.",
      digest: "Test digest",
      author: "Test Author",
      publishTime: "2025-01-15",
      url: "https://example.com"
    };
    
    const fieldMapping = data.fieldMapping || { enabled: false, fields: {} };
    const advancedSettings = data.advancedSettings || {};
    
    // 模拟validateArticleData函数的逻辑
    let fieldMap;
    if (fieldMapping.enabled) {
      fieldMap = fieldMapping.fields;
    } else {
      fieldMap = {
        title: 'title',
        content: 'content',
        author: '',
        publishTime: '',
        digest: '',
        sourceUrl: '',
        images: '',
        slug: ''
      };
    }
    
    const testData = {};
    
    // 基本字段
    if (fieldMap.title && fieldMap.title.trim()) {
      testData[fieldMap.title] = mockArticle.title;
    }
    
    if (fieldMap.content && fieldMap.content.trim()) {
      testData[fieldMap.content] = mockArticle.content;
    }
    
    if (mockArticle.digest && fieldMap.digest && fieldMap.digest.trim()) {
      const maxLength = fieldMap.digest === 'description' ? 80 : 500;
      testData[fieldMap.digest] = mockArticle.digest.substring(0, maxLength);
    }
    
    if (advancedSettings.generateSlug && fieldMap.slug && fieldMap.slug.trim()) {
      testData[fieldMap.slug] = 'test-article';
    }
    
    // Blocks处理
    if (advancedSettings.includeBlocksField) {
      testData.blocks = [];
      
      if (advancedSettings.putContentInBlocks && mockArticle.content) {
        const richTextBlock = {
          __component: advancedSettings.blocksComponentName || 'blocks.rich-text',
          content: mockArticle.content
        };
        testData.blocks.push(richTextBlock);
      }
    }
    
    const debugOutput = document.getElementById('debugOutput');
    debugOutput.style.display = 'block';
    debugOutput.innerHTML = `
      <strong>Test Data Generation:</strong><br><br>
      <strong>Field Mapping Enabled:</strong> ${fieldMapping.enabled}<br>
      <strong>Field Map:</strong><br>
      <pre>${JSON.stringify(fieldMap, null, 2)}</pre><br>
      <strong>Advanced Settings:</strong><br>
      <pre>${JSON.stringify(advancedSettings, null, 2)}</pre><br>
      <strong>Generated Data for Strapi:</strong><br>
      <pre>${JSON.stringify(testData, null, 2)}</pre><br>
      <strong>Blocks Type:</strong> ${typeof testData.blocks}<br>
      <strong>Blocks Is Array:</strong> ${Array.isArray(testData.blocks)}<br>
      <strong>Data Keys:</strong> ${Object.keys(testData).join(', ')}
    `;
  });
}

// 重置功能：清除所有设置
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
    chrome.storage.sync.clear(() => {
      updateStatus('All settings cleared. Please reconfigure.');
      
      // 设置安全的默认值
      const safeDefaults = {
        strapiUrl: '',
        token: '',
        collection: 'articles',
        fieldMapping: {
          enabled: true,  // 默认启用字段映射
          fields: {
            title: 'title',
            content: 'description',  // 根据用户的结构设置
            author: '',
            publishTime: '',
            digest: '',
            sourceUrl: '',
            images: '',
            slug: 'slug'
          }
        },
                            advancedSettings: {
             maxContentLength: 50000,
             maxImages: 10,
             generateSlug: true,
             uploadImages: false,  // 默认禁用图片上传
             sanitizeContent: true,
             includeBlocksField: true,  // 默认启用blocks字段
             putContentInBlocks: true,  // 默认将内容放入blocks
             blocksComponentName: 'blocks.rich-text'  // 默认组件名
           }
      };
      
      chrome.storage.sync.set(safeDefaults, () => {
        updateStatus('Safe defaults applied. Please configure your Strapi URL and token.');
        load(); // 重新加载页面
      });
    });
  }
}

// 保存按钮事件
document.getElementById('save').addEventListener('click', save);

// 调试按钮事件
document.getElementById('debug').addEventListener('click', debugSettings);

// 测试数据生成按钮事件
document.getElementById('testData').addEventListener('click', testDataGeneration);

// 重置按钮事件
document.getElementById('reset').addEventListener('click', resetSettings);

// 页面加载事件
document.addEventListener('DOMContentLoaded', load);
