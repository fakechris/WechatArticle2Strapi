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
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // 替换空格和特殊字符为-
    .replace(/^-+|-+$/g, '') // 移除开头和结尾的-
    .substring(0, 50); // 限制长度
  
  // 添加时间戳确保唯一性
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6); // 4位随机字符
  
  // 组合基础slug + 时间戳后4位 + 随机字符，确保唯一性且保持可读性
  const uniqueSlug = `${baseSlug}-${timestamp.toString().slice(-4)}-${randomSuffix}`;
  
  return uniqueSlug.substring(0, 60); // 稍微增加总长度限制以容纳唯一标识符
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
      slug: '',
      // New enhanced metadata fields
      siteName: '',
      language: '',
      tags: '',
      readingTime: '',
      created: ''
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
  
  // 图片字段 - 只有在映射了有效字段名时才添加
  if (article.processedImages && article.processedImages.length > 0 && fieldMap.images && fieldMap.images.trim()) {
    data[fieldMap.images] = article.processedImages;
  }
  
    // Slug字段 - 如果启用自动生成且映射了有效字段名
  if (advancedSettings.generateSlug && fieldMap.slug && fieldMap.slug.trim()) {
    data[fieldMap.slug] = generateSlug(article.title);
  }

  // Enhanced metadata fields - 新增字段处理
  if (article.siteName && fieldMap.siteName && fieldMap.siteName.trim()) {
    data[fieldMap.siteName] = article.siteName.substring(0, 100);
  }

  if (article.language && fieldMap.language && fieldMap.language.trim()) {
    data[fieldMap.language] = article.language.substring(0, 10);
  }

  if (article.tags && article.tags.length > 0 && fieldMap.tags && fieldMap.tags.trim()) {
    // 可以作为JSON数组或逗号分隔字符串存储
    data[fieldMap.tags] = JSON.stringify(article.tags);
  }

  if (article.readingTime && fieldMap.readingTime && fieldMap.readingTime.trim()) {
    data[fieldMap.readingTime] = article.readingTime;
  }

  if (article.created && fieldMap.created && fieldMap.created.trim()) {
    data[fieldMap.created] = article.created;
  }

  // 调试信息：记录将要发送的字段
  console.log('Final data to send to Strapi:', {
    fields: Object.keys(data),
    fieldMappingEnabled: fieldMapping.enabled,
    fieldMap: fieldMap,
    dataContent: data
  });

  return data;
}

// 图片处理队列和状态管理
const imageProcessingQueue = (/* unused pure expression or super */ null && ([]));
const imageProcessingStatus = new Map();

// 智能图片处理器 - 增强版
async function processArticleImages(article) {
  console.log('🚀 启动智能图片处理系统...');
  
  if (!article.images || article.images.length === 0) {
    console.log('📷 没有发现图片，跳过处理');
    return article;
  }

  const config = await chrome.storage.sync.get(['advancedSettings']);
  const settings = config.advancedSettings || {};
  const maxImages = settings.maxImages || 20;
  const enableImageCompression = settings.enableImageCompression !== false;
  const imageQuality = settings.imageQuality || 0.8;
  
  console.log(`🔧 图片处理设置: 最大数量=${maxImages}, 压缩=${enableImageCompression}, 质量=${imageQuality}`);
  
  const processedImages = [];
  let updatedContent = article.content;
  const imagesToProcess = article.images.slice(0, maxImages);
  
  console.log(`📊 开始处理 ${imagesToProcess.length} 张图片`);
  
  // 创建进度追踪
  const progressTracker = {
    total: imagesToProcess.length,
    processed: 0,
    successful: 0,
    failed: 0,
    startTime: Date.now()
  };

  // 批量处理图片（并发处理以提高效率）
  const batchSize = 3; // 同时处理3张图片
  const batches = [];
  
  for (let i = 0; i < imagesToProcess.length; i += batchSize) {
    batches.push(imagesToProcess.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const batchPromises = batch.map((image, batchIndex) => 
      processIndividualImage(image, batchIndex, enableImageCompression, imageQuality, progressTracker)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i];
      const originalImage = batch[i];
      
      if (result.status === 'fulfilled' && result.value) {
        const processedImage = result.value;
        processedImages.push(processedImage);
        
        // 智能替换内容中的图片链接
        updatedContent = await smartReplaceImageInContent(
          updatedContent, 
          originalImage.src, 
          processedImage.uploaded
        );
        
        progressTracker.successful++;
        console.log(`✅ 图片 ${progressTracker.processed + 1}/${progressTracker.total} 处理成功`);
      } else {
        progressTracker.failed++;
        console.log(`❌ 图片 ${progressTracker.processed + 1}/${progressTracker.total} 处理失败:`, 
          result.reason || '未知错误');
      }
      
      progressTracker.processed++;
    }
    
    // 批次间短暂延迟，避免过载
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  const processingTime = Date.now() - progressTracker.startTime;
  
  console.log(`🎉 图片处理完成! 
    ✅ 成功: ${progressTracker.successful}
    ❌ 失败: ${progressTracker.failed}
    ⏱️ 耗时: ${processingTime}ms
    🚀 平均速度: ${Math.round(processingTime / progressTracker.total)}ms/图片`);

  return {
    ...article,
    content: updatedContent,
    processedImages,
    imageProcessingStats: {
      total: progressTracker.total,
      successful: progressTracker.successful,
      failed: progressTracker.failed,
      processingTime,
      averageTime: Math.round(processingTime / progressTracker.total)
    }
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
    
    // 先测试API是否可访问
    console.log('Testing API accessibility...');
    try {
      const testResponse = await fetch(`${config.strapiUrl}/api/${config.collection}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`
        }
      });
      console.log('API Test Status:', testResponse.status);
      if (testResponse.status === 404) {
        // 尝试不带 /api 前缀的路径
        const altEndpoint = `${config.strapiUrl}/${config.collection}`;
        console.log('Trying alternative endpoint:', altEndpoint);
        const altTestResponse = await fetch(altEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.token}`
          }
        });
        console.log('Alternative API Test Status:', altTestResponse.status);
        if (altTestResponse.ok) {
          endpoint = altEndpoint;
          console.log('Using alternative endpoint:', endpoint);
        }
      }
    } catch (testError) {
      console.warn('API test failed:', testError);
    }
    
    console.log('Sending article data to Strapi:', {
      endpoint,
      dataKeys: Object.keys(articleData),
      fieldMapping: fieldMapping.enabled ? fieldMapping.fields : 'default',
      maxContentLength: advancedSettings.maxContentLength
    });
    
    // 发送前最后检查
    console.log('About to send request with data:', {
      dataKeys: Object.keys(articleData),
      dataContent: articleData
    });
    
    const requestBody = { data: articleData };
    const requestBodyString = JSON.stringify(requestBody);
    
    console.log('Request body string length:', requestBodyString.length);
    console.log('Request body preview:', requestBodyString.substring(0, 500) + '...');
    
    console.log('=== Sending Request ===');
    console.log('Endpoint:', endpoint);
    console.log('Method: POST');
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token.substring(0, 10)}...`
    });
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`
      },
      body: requestBodyString
    });
    
    console.log('=== Response Details ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      // 先读取响应文本，避免多次读取body stream
      const responseText = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        // 尝试解析为JSON
        const errorData = JSON.parse(responseText);
        
        // 检查是否是slug重复错误
        if (errorData.error && 
            errorData.error.name === 'ValidationError' && 
            errorData.error.message && 
            errorData.error.message.includes('unique') &&
            errorData.error.details && 
            errorData.error.details.errors) {
          
          // 查找slug字段的错误
          const slugError = errorData.error.details.errors.find(err => 
            err.path && err.path.includes('slug') && err.message.includes('unique')
          );
          
          if (slugError) {
            console.log('Slug uniqueness conflict detected, retrying with new slug...');
            
            // 使用已存在的fieldMapping和advancedSettings变量
            const fieldMap = fieldMapping.enabled ? fieldMapping.fields : {
              title: 'title', content: 'content', slug: 'slug'
            };
            
            if (fieldMap.slug && advancedSettings.generateSlug) {
              // 生成新的更唯一的slug
              const timestamp = Date.now();
              const randomSuffix = Math.random().toString(36).substring(2, 8);
              const newSlug = generateSlug(processedArticle.title) + `-${timestamp}-${randomSuffix}`;
              
              // 更新数据中的slug
              const updatedData = { ...articleData };
              updatedData[fieldMap.slug] = newSlug.substring(0, 60);
              
              console.log(`Retrying with new slug: ${updatedData[fieldMap.slug]}`);
              console.log('Updated data keys:', Object.keys(updatedData));
              
              // 重新发送请求
              const retryRequestBody = { data: updatedData };
              const retryResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${config.token}`
                },
                body: JSON.stringify(retryRequestBody)
              });
              
              if (retryResponse.ok) {
                const result = await retryResponse.json();
                console.log('=== Retry Successful ===');
                console.log('Retry response:', result);
                console.log('Retry Article ID:', result.data?.id);
                return result;
              } else {
                // 如果重试还是失败，继续原来的错误处理逻辑
                const retryErrorText = await retryResponse.text();
                console.error('=== Retry Failed ===');
                console.error('Retry error status:', retryResponse.status);
                console.error('Retry error text:', retryErrorText);
                throw new Error(`Retry failed (${retryResponse.status}): ${retryErrorText.substring(0, 200)}`);
              }
            }
          }
        }
        
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
    
    const result = await response.json();
    console.log('=== Strapi API Response ===');
    console.log('Full response:', result);
    console.log('Response data:', result.data);
    console.log('Response ID:', result.data?.id);
    return result;
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

// 新增辅助函数支持增强的图片处理功能

// 处理单张图片的增强函数
async function processIndividualImage(image, index, enableCompression, quality, progressTracker) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 处理图片 ${index + 1}, 尝试 ${attempt}/${maxRetries}: ${image.src.substring(0, 60)}...`);
      
      // 智能检测图片类型和尺寸
      const imageInfo = await analyzeImageInfo(image.src);
      
      // 下载图片
      const tab = await chrome.tabs.query({ active: true, currentWindow: true });
      const imageData = await chrome.tabs.sendMessage(tab[0].id, {
        type: 'downloadImage',
        url: image.src,
        enableCompression,
        quality,
        maxWidth: 1200,
        maxHeight: 800
      });
      
      if (!imageData || !imageData.success) {
        throw new Error(`图片下载失败: ${imageData?.error || '未知错误'}`);
      }
      
      // 生成智能文件名
      const filename = generateSmartFilename(image, imageInfo, index);
      
      // 上传到Strapi媒体库
      console.log(`📤 上传图片到Strapi: ${filename}`);
      const uploadResult = await uploadImageToStrapiAdvanced(imageData.dataUrl, filename, imageInfo);
      
      if (!uploadResult || !uploadResult[0]) {
        throw new Error('Strapi上传返回空结果');
      }
      
      const uploadedFile = uploadResult[0];
      console.log(`✨ 图片上传成功: ${uploadedFile.name} (ID: ${uploadedFile.id})`);
      
      return {
        original: image.src,
        uploaded: uploadedFile.url,
        id: uploadedFile.id,
        filename: uploadedFile.name,
        size: uploadedFile.size,
        mimeType: uploadedFile.mime,
        width: uploadedFile.width,
        height: uploadedFile.height,
        processedAt: new Date().toISOString(),
        attempts: attempt,
        imageInfo
      };
      
    } catch (error) {
      lastError = error;
      console.log(`⚠️ 图片处理尝试 ${attempt} 失败:`, error.message);
      
      if (attempt < maxRetries) {
        // 指数退避重试策略
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.log(`💥 图片处理最终失败:`, lastError);
  throw lastError;
}

// 分析图片信息
async function analyzeImageInfo(imageUrl) {
  try {
    const urlParts = new URL(imageUrl);
    const pathParts = urlParts.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    const extension = filename.split('.').pop()?.toLowerCase();
    
    return {
      url: imageUrl,
      domain: urlParts.hostname,
      filename,
      extension,
      isWeChatImage: urlParts.hostname.includes('weixin') || urlParts.hostname.includes('qq.com'),
      estimatedType: getImageTypeFromExtension(extension),
      timestamp: Date.now()
    };
  } catch (error) {
    console.warn('图片信息分析失败:', error);
    return {
      url: imageUrl,
      timestamp: Date.now()
    };
  }
}

// 根据扩展名判断图片类型
function getImageTypeFromExtension(extension) {
  const typeMap = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  };
  return typeMap[extension] || 'image/jpeg';
}

// 生成智能文件名
function generateSmartFilename(image, imageInfo, index) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 8);
  
  let baseName = 'wechat-article-image';
  
  // 如果是微信图片，添加特殊标识
  if (imageInfo.isWeChatImage) {
    baseName = 'wechat-mp-image';
  }
  
  // 添加图片索引
  baseName += `-${index + 1}`;
  
  // 添加时间戳和随机ID确保唯一性
  baseName += `-${timestamp}-${randomId}`;
  
  // 确定文件扩展名
  const extension = imageInfo.extension || 'jpg';
  
  return `${baseName}.${extension}`;
}

// 增强的Strapi图片上传函数
async function uploadImageToStrapiAdvanced(imageDataUrl, filename, imageInfo) {
  const config = await chrome.storage.sync.get(['strapiUrl', 'token']);
  
  if (!config.strapiUrl || !config.token) {
    throw new Error('Strapi配置不完整');
  }
  
  try {
    // 将base64转换为blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    
    // 验证图片大小
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (blob.size > maxSize) {
      throw new Error(`图片过大: ${Math.round(blob.size / 1024 / 1024)}MB > 10MB`);
    }
    
    const formData = new FormData();
    formData.append('files', blob, filename);
    
    // 添加额外的元数据
    if (imageInfo) {
      formData.append('fileInfo', JSON.stringify({
        caption: `来自微信文章的图片: ${filename}`,
        alternativeText: imageInfo.filename || filename,
        name: filename
      }));
    }
    
    console.log(`📤 开始上传: ${filename} (${Math.round(blob.size / 1024)}KB)`);
    
    const uploadResponse = await fetch(`${config.strapiUrl}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`上传失败 (${uploadResponse.status}): ${errorText}`);
    }
    
    const result = await uploadResponse.json();
    console.log(`✅ 上传成功: ${filename}`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ 图片上传失败 (${filename}):`, error);
    throw error;
  }
}

// 智能替换内容中的图片链接
async function smartReplaceImageInContent(content, originalUrl, newUrl) {
  if (!content || !originalUrl || !newUrl) {
    return content;
  }
  
  // 多种替换策略确保完全替换
  let updatedContent = content;
  
  // 1. 直接替换完整URL
  updatedContent = updatedContent.replace(new RegExp(escapeRegExp(originalUrl), 'g'), newUrl);
  
  // 2. 替换可能的data-src属性
  updatedContent = updatedContent.replace(
    new RegExp(`data-src="[^"]*${escapeRegExp(originalUrl.split('/').pop())}"`, 'g'),
    `data-src="${newUrl}"`
  );
  
  // 3. 替换src属性
  updatedContent = updatedContent.replace(
    new RegExp(`src="[^"]*${escapeRegExp(originalUrl.split('/').pop())}"`, 'g'),
    `src="${newUrl}"`
  );
  
  // 4. 处理可能的URL编码情况
  const encodedOriginal = encodeURIComponent(originalUrl);
  if (encodedOriginal !== originalUrl) {
    updatedContent = updatedContent.replace(new RegExp(escapeRegExp(encodedOriginal), 'g'), newUrl);
  }
  
  return updatedContent;
}

// 辅助函数：转义正则表达式特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/******/ })()
;