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
      slug: document.getElementById('slugField').value.trim() || 'slug',
      // Enhanced metadata fields
      siteName: document.getElementById('siteNameField').value.trim(),
      language: document.getElementById('languageField').value.trim(),
      tags: document.getElementById('tagsField').value.trim(),
      readingTime: document.getElementById('readingTimeField').value.trim(),
      created: document.getElementById('createdField').value.trim(),
      // 🔥 新增：头图字段
      headImg: document.getElementById('headImgField').value.trim()
    }
  };
}

function getFieldPresets() {
  const useFieldPresets = document.getElementById('useFieldPresets').checked;
  
  if (!useFieldPresets) {
    return {
      enabled: false,
      presets: {}
    };
  }
  
  const presets = {};
  const presetRows = document.querySelectorAll('.preset-field-row');
  
  presetRows.forEach(row => {
    const fieldName = row.querySelector('.field-name').value.trim();
    const fieldValue = row.querySelector('.field-value').value.trim();
    const fieldType = row.querySelector('.field-type').value;
    
    if (fieldName && fieldValue) {
      presets[fieldName] = {
        value: fieldValue,
        type: fieldType
      };
    }
  });
  
  return {
    enabled: true,
    presets: presets
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
    blocksComponentName: document.getElementById('blocksComponentName').value.trim() || 'blocks.rich-text',
    // 新增图片处理设置
    enableImageCompression: document.getElementById('enableImageCompression').checked,
    imageQuality: parseFloat(document.getElementById('imageQuality').value) || 0.8,
    maxImageWidth: parseInt(document.getElementById('maxImageWidth').value) || 1200,
    maxImageHeight: parseInt(document.getElementById('maxImageHeight').value) || 800,
    smartImageReplace: document.getElementById('smartImageReplace').checked,
    retryFailedImages: document.getElementById('retryFailedImages').checked,
    // 🔥 新增：头图设置
    uploadHeadImg: document.getElementById('uploadHeadImg').checked,
    headImgIndex: parseInt(document.getElementById('headImgIndex').value) || 0
  };
}

function getCleanupRulesSettings() {
  const enableCleanupRules = document.getElementById('enableCleanupRules').checked;
  let customCleanupRules = [];
  
  const customRulesText = document.getElementById('customCleanupRules').value.trim();
  if (customRulesText) {
    try {
      customCleanupRules = JSON.parse(customRulesText);
      if (!Array.isArray(customCleanupRules)) {
        throw new Error('Custom rules must be an array');
      }
      // Validate rule format
      customCleanupRules.forEach((rule, index) => {
        if (!rule.type || !rule.value || !rule.description) {
          throw new Error(`Rule ${index + 1} missing required fields (type, value, description)`);
        }
      });
    } catch (error) {
      alert('Invalid custom cleanup rules JSON: ' + error.message);
      return null;
    }
  }
  
  return {
    enableCleanupRules,
    customCleanupRules
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
        slug: 'slug',
        // Enhanced metadata fields
        siteName: '',
        language: '',
        tags: '',
        readingTime: '',
        created: '',
        // 🔥 新增：头图字段
        headImg: ''
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
      includeBlocksField: true,
      putContentInBlocks: false,
      blocksComponentName: 'blocks.rich-text',
      // 图片处理默认设置
      enableImageCompression: true,
      imageQuality: 0.8,
      maxImageWidth: 1200,
      maxImageHeight: 800,
      smartImageReplace: true,
      retryFailedImages: true,
      // 🔥 新增：头图相关设置
      uploadHeadImg: false,
      headImgIndex: 0
    }
  };
  
  chrome.storage.sync.get([...Object.keys(defaultSettings), 'enableCleanupRules', 'customCleanupRules'], data => {
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
    
    // Enhanced metadata fields
    document.getElementById('siteNameField').value = fieldMapping.fields.siteName || '';
    document.getElementById('languageField').value = fieldMapping.fields.language || '';
    document.getElementById('tagsField').value = fieldMapping.fields.tags || '';
    document.getElementById('readingTimeField').value = fieldMapping.fields.readingTime || '';
    document.getElementById('createdField').value = fieldMapping.fields.created || '';
    // 🔥 新增：头图字段
    document.getElementById('headImgField').value = fieldMapping.fields.headImg || '';
    
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
    
    // 图片处理设置
    document.getElementById('enableImageCompression').checked = advancedSettings.enableImageCompression !== false;
    document.getElementById('imageQuality').value = advancedSettings.imageQuality || 0.8;
    document.getElementById('maxImageWidth').value = advancedSettings.maxImageWidth || 1200;
    document.getElementById('maxImageHeight').value = advancedSettings.maxImageHeight || 800;
    document.getElementById('smartImageReplace').checked = advancedSettings.smartImageReplace !== false;
    document.getElementById('retryFailedImages').checked = advancedSettings.retryFailedImages !== false;
    
    // 🔥 新增：头图设置
    document.getElementById('uploadHeadImg').checked = advancedSettings.uploadHeadImg || false;
    document.getElementById('headImgIndex').value = advancedSettings.headImgIndex || 0;
    
    // 初始化头图配置显示状态
    toggleHeadImgConfig();
    
    // 规则引擎设置
    document.getElementById('enableCleanupRules').checked = data.enableCleanupRules !== false; // 默认启用
    if (data.customCleanupRules && Array.isArray(data.customCleanupRules)) {
      document.getElementById('customCleanupRules').value = JSON.stringify(data.customCleanupRules, null, 2);
    }
    
    // 预设值配置
    const fieldPresets = data.fieldPresets || { enabled: false, presets: {} };
    document.getElementById('useFieldPresets').checked = fieldPresets.enabled;
    
    if (fieldPresets.enabled) {
      document.getElementById('fieldPresetsConfig').style.display = 'block';
    }
    
    // 加载预设字段
    loadPresetFields(fieldPresets.presets);
    
    // 初始化显示状态
    toggleBlocksConfig();
  });
}

function save() {
  if (!validateForm()) {
    return;
  }
  
  const cleanupRulesSettings = getCleanupRulesSettings();
  if (!cleanupRulesSettings) {
    return; // Validation failed
  }
  
  const data = {
    strapiUrl: document.getElementById('strapiUrl').value.trim().replace(/\/$/, ''), // 移除尾部斜杠
    token: document.getElementById('token').value.trim(),
    collection: document.getElementById('collection').value.trim(),
    fieldMapping: getFieldMapping(),
    fieldPresets: getFieldPresets(),
    advancedSettings: getAdvancedSettings(),
    enableCleanupRules: cleanupRulesSettings.enableCleanupRules,
    customCleanupRules: cleanupRulesSettings.customCleanupRules
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

// 切换预设值配置显示
function toggleFieldPresets() {
  const useFieldPresets = document.getElementById('useFieldPresets').checked;
  const configSection = document.getElementById('fieldPresetsConfig');
  
  if (useFieldPresets) {
    configSection.style.display = 'block';
  } else {
    configSection.style.display = 'none';
  }
}

// 加载预设字段
function loadPresetFields(presets) {
  const container = document.getElementById('presetFieldsList');
  container.innerHTML = '';
  
  // 如果没有预设字段，添加一个空的示例行
  if (Object.keys(presets).length === 0) {
    addPresetFieldRow('', '', 'text');
  } else {
    // 加载已有的预设字段
    Object.entries(presets).forEach(([fieldName, config]) => {
      addPresetFieldRow(fieldName, config.value, config.type || 'text');
    });
  }
}

// 添加预设字段行
function addPresetFieldRow(fieldName = '', value = '', type = 'text') {
  const container = document.getElementById('presetFieldsList');
  const row = document.createElement('div');
  row.className = 'preset-field-row';
  
  row.innerHTML = `
    <input type="text" class="field-name" placeholder="Field name (e.g., news_source)" value="${fieldName}">
    <select class="field-type">
      <option value="text" ${type === 'text' ? 'selected' : ''}>Text</option>
      <option value="number" ${type === 'number' ? 'selected' : ''}>Number</option>
      <option value="boolean" ${type === 'boolean' ? 'selected' : ''}>Boolean</option>
      <option value="json" ${type === 'json' ? 'selected' : ''}>JSON</option>
    </select>
    <input type="text" class="field-value" placeholder="Default value (e.g., reprint)" value="${value}">
    <button type="button" class="remove-btn">Remove</button>
  `;
  
  container.appendChild(row);
}

// 移除预设字段行
function removePresetFieldRow(button) {
  const row = button.closest('.preset-field-row');
  row.remove();
  
  // 如果没有行了，添加一个空行
  const container = document.getElementById('presetFieldsList');
  if (container.children.length === 0) {
    addPresetFieldRow();
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

// 预设值切换事件
document.getElementById('useFieldPresets').addEventListener('change', toggleFieldPresets);

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

// 备份当前设置
function backupSettings() {
  chrome.storage.sync.get(null, (data) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `wechat-extractor-settings-backup-${timestamp}.json`;
    
    const backup = {
      timestamp: new Date().toISOString(),
      settings: data,
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    updateStatus(`✅ 设置已备份到文件: ${filename}`);
  });
}

// 恢复设置
function restoreSettings() {
  document.getElementById('restoreFile').click();
}

// 处理文件恢复
function handleFileRestore(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const backup = JSON.parse(e.target.result);
      
      // 验证备份文件格式
      if (!backup.settings || !backup.timestamp || !backup.version) {
        updateStatus('❌ 备份文件格式无效', true);
        return;
      }
      
      // 确认恢复
      if (!confirm(`📂 确认恢复设置？\n\n备份时间: ${new Date(backup.timestamp).toLocaleString()}\n版本: ${backup.version}\n\n这将覆盖当前所有设置！`)) {
        updateStatus('恢复操作已取消');
        return;
      }
      
      // 恢复设置
      updateStatus('正在恢复设置...');
      chrome.storage.sync.clear(() => {
        chrome.storage.sync.set(backup.settings, () => {
          updateStatus('✅ 设置恢复成功！正在重新加载页面...');
          setTimeout(() => {
            load();
          }, 1000);
        });
      });
      
    } catch (error) {
      updateStatus('❌ 备份文件解析失败: ' + error.message, true);
    }
  };
  
  reader.readAsText(file);
  
  // 清空文件输入，允许重复选择同一文件
  event.target.value = '';
}

// 重置功能：清除所有设置
function resetSettings() {
  // 第一层确认：基本警告
  if (!confirm('⚠️ 警告：此操作将删除所有配置数据！\n\n这包括：\n• Strapi URL 和 Token\n• 字段映射配置\n• 高级设置\n• 自定义清理规则\n\n此操作不可撤销，确定要继续吗？')) {
    return;
  }
  
  // 询问是否需要备份
  if (confirm('💾 建议先备份当前设置。是否现在备份？\n\n点击"确定"先备份设置，点击"取消"直接继续重置。')) {
    backupSettings();
    // 给用户时间保存备份文件
    setTimeout(() => {
      continueReset();
    }, 2000);
    return;
  }
  
  continueReset();
}

// 继续重置流程
function continueReset() {
  // 第二层确认：更严格的验证
  const confirmText = '确认重置';
  const userInput = prompt(`⚠️ 最后确认：为了防止误操作，请输入"${confirmText}"来确认重置所有设置：`);
  
  if (userInput !== confirmText) {
    updateStatus('重置操作已取消', false);
    return;
  }
  
  // 显示重置进度
  updateStatus('正在重置设置...');
  document.getElementById('reset').disabled = true;
  document.getElementById('reset').textContent = '重置中...';
  
  chrome.storage.sync.clear(() => {
    updateStatus('✅ 所有设置已清除，正在应用默认配置...');
    
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
        includeBlocksField: false,  // 简化：默认禁用blocks字段
        putContentInBlocks: false,  // 简化：默认不使用blocks
        blocksComponentName: 'blocks.rich-text'  // 默认组件名
      },
      enableCleanupRules: true,  // 默认启用规则引擎
      customCleanupRules: []     // 空的自定义规则
    };
    
    chrome.storage.sync.set(safeDefaults, () => {
      // 恢复按钮状态
      document.getElementById('reset').disabled = false;
      document.getElementById('reset').textContent = 'Reset All Settings';
      
      updateStatus('🎉 重置完成！已应用安全默认配置，请重新配置您的 Strapi URL 和 Token');
      
      // 重新加载页面以显示默认值
      setTimeout(() => {
        load();
      }, 1000);
    });
  });
}

// 保存按钮事件
document.getElementById('save').addEventListener('click', save);

// 调试按钮事件
document.getElementById('debug').addEventListener('click', debugSettings);

// 测试数据生成按钮事件
document.getElementById('testData').addEventListener('click', testDataGeneration);

// 备份按钮事件
document.getElementById('backup').addEventListener('click', backupSettings);

// 恢复按钮事件
document.getElementById('restore').addEventListener('click', restoreSettings);

// 文件选择事件
document.getElementById('restoreFile').addEventListener('change', handleFileRestore);

// 重置按钮事件
document.getElementById('reset').addEventListener('click', resetSettings);

// 页面加载事件
document.addEventListener('DOMContentLoaded', function() {
  load();
  
  // 添加预设字段按钮事件（需要在DOM加载后绑定）
  document.getElementById('addPresetField').addEventListener('click', function() {
    addPresetFieldRow();
  });
  
  // 使用事件委托处理删除按钮点击（因为按钮是动态生成的）
  document.getElementById('presetFieldsList').addEventListener('click', function(event) {
    if (event.target && event.target.classList.contains('remove-btn')) {
      removePresetFieldRow(event.target);
    }
  });
  
  // 🔥 新增：头图配置切换事件监听器
  document.getElementById('uploadHeadImg').addEventListener('change', toggleHeadImgConfig);
});

// 🔥 新增：切换头图配置显示
function toggleHeadImgConfig() {
  const uploadHeadImg = document.getElementById('uploadHeadImg').checked;
  const configSection = document.getElementById('headImgConfig');
  
  if (configSection) {
    if (uploadHeadImg) {
      configSection.style.display = 'block';
    } else {
      configSection.style.display = 'none';
    }
  }
}
