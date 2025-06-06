/******/ (() => { // webpackBootstrap
// 上传图片到Strapi媒体库
async function uploadImageToStrapi(imageDataUrl, filename) {
  const config = await chrome.storage.sync.get(['strapiUrl', 'token']);
  
  // 将base64转换为blob
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  
  const formData = new FormData();
  formData.append('files', blob, filename);
  
  const uploadResponse = await fetch(`${config.strapiUrl}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`
    },
    body: formData
  });
  
  if (!uploadResponse.ok) {
    throw new Error(`Image upload failed: ${uploadResponse.status}`);
  }
  
  return uploadResponse.json();
}

// 净化和限制内容长度
function sanitizeContent(content, maxLength = 50000) {
  if (!content) return '';
  
  // 移除可能导致问题的HTML属性和标签
  let sanitized = content
    .replace(/data-[^=]*="[^"]*"/g, '') // 移除data-*属性
    .replace(/style="[^"]*"/g, '') // 移除style属性
    .replace(/class="[^"]*"/g, '') // 移除class属性
    .replace(/id="[^"]*"/g, '') // 移除id属性
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // 移除script标签
    .replace(/<style[^>]*>.*?<\/style>/gi, '') // 移除style标签
    .replace(/&nbsp;/g, ' ') // 替换&nbsp;
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim();
  
  // 如果内容过长，截取并添加省略号
  if (sanitized.length > maxLength) {
    // 尽量在完整的HTML标签处截断
    const truncated = sanitized.substring(0, maxLength);
    const lastCompleteTag = truncated.lastIndexOf('>');
    
    if (lastCompleteTag > maxLength - 1000) {
      sanitized = truncated.substring(0, lastCompleteTag + 1) + '...';
    } else {
      sanitized = truncated + '...';
    }
  }
  
  return sanitized;
}

// 生成URL友好的slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // 替换空格和特殊字符为-
    .replace(/^-+|-+$/g, '') // 移除开头和结尾的-
    .substring(0, 50); // 限制长度
}

// 验证和格式化文章数据
function validateArticleData(article, fieldMapping, advancedSettings) {
  const errors = [];
  
  // 验证必填字段
  if (!article.title || article.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!article.content || article.content.trim().length === 0) {
    errors.push('Content is required');
  }
  
  // 验证字段长度
  if (article.title && article.title.length > 255) {
    errors.push('Title too long (max 255 characters)');
  }
  
  if (errors.length > 0) {
    throw new Error('Validation failed: ' + errors.join(', '));
  }
  
  // 获取字段映射
  let fieldMap;
  if (fieldMapping.enabled) {
    fieldMap = fieldMapping.fields;
  } else {
    // 如果未启用字段映射，只使用最基本的字段
    fieldMap = {
      title: 'title',
      content: 'content',
      author: '',
      publishTime: '',
      digest: '',
      sourceUrl: '',
      images: '',
      slug: ''  // 默认情况下也不生成slug
    };
  }
  
  console.log('Field mapping details:', {
    enabled: fieldMapping.enabled,
    originalFields: fieldMapping.fields,
    finalFieldMap: fieldMap
  });
  
  // 构建数据对象
  const data = {};
  
  // 基本字段 - title和content是必需的，但需要检查映射字段名是否有效
  if (fieldMap.title && fieldMap.title.trim()) {
    data[fieldMap.title] = article.title.trim().substring(0, 255);
  }
  
  // 内容字段 - 使用设置中的最大长度
  if (fieldMap.content && fieldMap.content.trim()) {
    const maxContentLength = advancedSettings.maxContentLength || 50000;
    data[fieldMap.content] = advancedSettings.sanitizeContent 
      ? sanitizeContent(article.content, maxContentLength)
      : article.content.substring(0, maxContentLength);
  }
  
  // 作者字段 - 只有在映射了有效字段名时才添加
  if (article.author && fieldMap.author && fieldMap.author.trim()) {
    data[fieldMap.author] = article.author.trim().substring(0, 100);
  }
  
  // 发布时间字段 - 只有在映射了有效字段名时才添加
  if (article.publishTime && fieldMap.publishTime && fieldMap.publishTime.trim()) {
    data[fieldMap.publishTime] = article.publishTime.trim();
  }
  
  // 摘要字段 - 只有在映射了有效字段名时才添加
  if (article.digest && fieldMap.digest && fieldMap.digest.trim()) {
    // 如果映射到description字段，限制为80字符
    const maxLength = fieldMap.digest === 'description' ? 80 : 500;
    data[fieldMap.digest] = article.digest.trim().substring(0, maxLength);
  }
  
  // 源URL字段 - 只有在映射了有效字段名时才添加
  if (article.url && fieldMap.sourceUrl && fieldMap.sourceUrl.trim()) {
    data[fieldMap.sourceUrl] = article.url;
  }
  
  // 图片字段 - 只有在映射了有效字段名时才添加，但不能映射到blocks
  if (article.processedImages && article.processedImages.length > 0 && fieldMap.images && fieldMap.images.trim() && fieldMap.images !== 'blocks') {
    data[fieldMap.images] = article.processedImages;
  }
  
  // Slug字段 - 如果启用自动生成且映射了有效字段名
  if (advancedSettings.generateSlug && fieldMap.slug && fieldMap.slug.trim()) {
    data[fieldMap.slug] = generateSlug(article.title);
  }
  
  // 检查是否有字段被映射到了blocks
  const fieldsMappedToBlocks = Object.entries(fieldMap).filter(([key, value]) => value === 'blocks');
  if (fieldsMappedToBlocks.length > 0) {
    console.warn('Warning: Some fields are mapped to "blocks":', fieldsMappedToBlocks);
    console.warn('This may cause conflicts with Dynamic Zone handling');
  }
  
  // Strapi Dynamic Zone (blocks) 特殊处理
  if (advancedSettings.includeBlocksField) {
    // 确保blocks字段总是数组，即使有其他映射
    data.blocks = [];
    
    console.log('Initialized blocks array');
    
    // 如果启用了将内容放入blocks
    if (advancedSettings.putContentInBlocks && article.content) {
      const maxContentLength = advancedSettings.maxContentLength || 50000;
      const contentToUse = advancedSettings.sanitizeContent 
        ? sanitizeContent(article.content, maxContentLength)
        : article.content.substring(0, maxContentLength);
      
      // 创建富文本块
      const richTextBlock = {
        __component: advancedSettings.blocksComponentName || 'blocks.rich-text',
        content: contentToUse
      };
      
      data.blocks.push(richTextBlock);
      
      console.log('Added content to blocks:', {
        componentName: richTextBlock.__component,
        contentLength: contentToUse.length,
        blocksArrayLength: data.blocks.length,
        blocksType: typeof data.blocks
      });
    }
    
    console.log('Final blocks setup:', {
      blocksType: typeof data.blocks,
      blocksLength: Array.isArray(data.blocks) ? data.blocks.length : 'not array',
      blocksContent: data.blocks
    });
  }
  
  // 不再自动添加元数据字段，只发送明确映射的字段
  
  // 调试信息：记录将要发送的字段
  console.log('Final data to send to Strapi:', {
    fields: Object.keys(data),
    fieldMappingEnabled: fieldMapping.enabled,
    fieldMap: fieldMap,
    blocksType: typeof data.blocks,
    blocksContent: data.blocks,
    dataContent: data
  });
  
  return data;
}

// 处理文章内容中的图片
async function processArticleImages(article) {
  if (!article.images || article.images.length === 0) {
    return article;
  }
  
  const processedImages = [];
  let updatedContent = article.content;
  
  // 限制处理的图片数量
  const maxImages = 10;
  const imagesToProcess = article.images.slice(0, maxImages);
  
  for (const image of imagesToProcess) {
    try {
      // 下载图片
      const tab = await chrome.tabs.query({ active: true, currentWindow: true });
      const imageData = await chrome.tabs.sendMessage(tab[0].id, {
        type: 'downloadImage',
        url: image.src
      });
      
      if (imageData && imageData.success) {
        // 上传到Strapi
        const filename = `wechat-image-${Date.now()}-${image.index}.jpg`;
        const uploadResult = await uploadImageToStrapi(imageData.dataUrl, filename);
        
        if (uploadResult && uploadResult[0]) {
          const newImageUrl = uploadResult[0].url;
          processedImages.push({
            original: image.src,
            uploaded: newImageUrl,
            id: uploadResult[0].id
          });
          
          // 替换内容中的图片链接
          updatedContent = updatedContent.replace(image.src, newImageUrl);
        }
      }
    } catch (error) {
      console.error('Error processing image:', error);
      // 继续处理其他图片，不要因为一个图片失败而中断整个流程
    }
  }
  
  return {
    ...article,
    content: updatedContent,
    processedImages
  };
}

async function sendToStrapi(article) {
  console.log('=== sendToStrapi function called ===');
  console.log('Article data received:', {
    title: article.title,
    hasImages: !!article.images,
    imageCount: article.images ? article.images.length : 0,
    contentLength: article.content ? article.content.length : 0
  });
  
  try {
    const config = await chrome.storage.sync.get(['strapiUrl', 'token', 'collection', 'fieldMapping', 'advancedSettings']);
    console.log('Config loaded:', {
      hasUrl: !!config.strapiUrl,
      hasToken: !!config.token,
      collection: config.collection,
      fieldMappingEnabled: config.fieldMapping?.enabled,
      fieldMappingFields: config.fieldMapping?.fields
    });
    
    // 验证配置
    if (!config.strapiUrl || !config.token || !config.collection) {
      throw new Error('Strapi configuration is incomplete. Please check options.');
    }
    
    // 使用默认值如果设置不存在
    const fieldMapping = config.fieldMapping || { enabled: false, fields: {} };
    const advancedSettings = config.advancedSettings || {
      maxContentLength: 50000,
      maxImages: 10,
      generateSlug: true,
      uploadImages: true,
      sanitizeContent: true
    };
    
    // 处理图片（如果启用）
    let processedArticle = article;
    if (advancedSettings.uploadImages) {
      processedArticle = await processArticleImages(article);
    }
    
    // 验证和格式化数据
    const articleData = validateArticleData(processedArticle, fieldMapping, advancedSettings);
    
    const endpoint = `${config.strapiUrl}/api/${config.collection}`;
    
    console.log('Sending article data to Strapi:', {
      endpoint,
      dataKeys: Object.keys(articleData),
      fieldMapping: fieldMapping.enabled ? fieldMapping.fields : 'default',
      maxContentLength: advancedSettings.maxContentLength
    });
    
    // 发送前最后检查
    console.log('About to send request with data:', {
      dataKeys: Object.keys(articleData),
      blocksType: typeof articleData.blocks,
      blocksIsArray: Array.isArray(articleData.blocks),
      blocksContent: articleData.blocks
    });
    
    const requestBody = { data: articleData };
    const requestBodyString = JSON.stringify(requestBody);
    
    console.log('Request body string length:', requestBodyString.length);
    console.log('Request body preview:', requestBodyString.substring(0, 500) + '...');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`
      },
      body: requestBodyString
    });
    
    if (!response.ok) {
      // 先读取响应文本，避免多次读取body stream
      const responseText = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        // 尝试解析为JSON
        const errorData = JSON.parse(responseText);
        
        // 提供更友好的错误信息
        if (errorData.error && errorData.error.name === 'ValidationError') {
          const field = errorData.error.details?.key || 'unknown field';
          const message = errorData.error.message || 'validation failed';
          throw new Error(`Validation error on field '${field}': ${message}. Please check your Strapi collection configuration and field mapping.`);
        }
        
        // 检查是否是字段不存在的错误
        if (errorData.error && errorData.error.message && errorData.error.message.includes('Invalid key')) {
          throw new Error(`Field mapping error: ${errorData.error.message}. Please check your field mapping configuration in settings.`);
        }
        
        // 使用错误数据中的消息
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
          
          // 如果是字段验证错误，提供更详细的信息
          if (errorData.error.details && errorData.error.details.errors) {
            const detailErrors = errorData.error.details.errors.map(e => e.message).join(', ');
            errorMessage += `: ${detailErrors}`;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // 如果不是JSON，使用原始响应文本
        errorMessage = responseText.substring(0, 200);
      }
      
      throw new Error(`Strapi API error (${response.status}): ${errorMessage}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error sending to Strapi:', error);
    throw error;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'sendToStrapi') {
    sendToStrapi(msg.article)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => {
        console.error('=== Strapi API Error ===');
        console.error('Error:', err.message);
        console.error('Original article:', msg.article);
        sendResponse({ success: false, error: err.message });
      });
    return true; // 保持消息通道开放
  }
});

/******/ })()
;