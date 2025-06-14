/**
 * 重构后的Background Script - 使用共享模块
 * 消除代码重复，统一CLI和Chrome Extension的逻辑
 */

import { StrapiIntegration } from '../shared/core/integrations/strapi-integration.js';

class ChromeExtensionStrapiService {
  constructor() {
    this.strapiIntegration = null;
    this.config = null;
  }

  /**
   * 初始化Strapi服务
   */
  async initialize() {
    try {
      this.config = await this.loadConfig();
      this.strapiIntegration = new StrapiIntegration(this.config, {
        environment: 'browser',
        verbose: true,
        debug: true
      });
      console.log('✅ Strapi服务初始化成功');
    } catch (error) {
      console.error('❌ Strapi服务初始化失败:', error.message);
      throw error;
    }
  }

  /**
   * 从Chrome Storage加载配置
   */
  async loadConfig() {
    return new Promise((resolve, reject) => {
      const configKeys = [
        'strapiUrl', 'token', 'collection', 
        'fieldMapping', 'fieldPresets', 'advancedSettings'
      ];

      chrome.storage.sync.get(configKeys, (data) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        // 标准化配置（与CLI一致）
        const config = {
          strapiUrl: data.strapiUrl || '',
          token: data.token || '',
          collection: data.collection || 'articles',
          fieldMapping: data.fieldMapping || { enabled: false, fields: {} },
          fieldPresets: data.fieldPresets || { enabled: false, presets: {} },
          advancedSettings: {
            maxContentLength: 50000,
            generateSlug: true,
            uploadImages: true,
            sanitizeContent: true,
            uploadHeadImg: true,     // 🔥 强制启用头图上传
            headImgIndex: 0,         // 使用第一张图片
            maxImages: 10,
            enableImageCompression: true,
            imageQuality: 0.8,
            maxImageWidth: 1200,
            maxImageHeight: 800,
            smartImageReplace: true,
            retryFailedImages: true,
            // 合并用户的自定义设置
            ...(data.advancedSettings || {})
          }
        };

        resolve(config);
      });
    });
  }

  /**
   * 发送文章到Strapi（使用共享逻辑）
   */
  async sendToStrapi(article) {
    if (!this.strapiIntegration) {
      await this.initialize();
    }

    console.log('=== 🎯 使用共享模块发送到Strapi ===');
    console.log('📋 原始文章数据:', {
      title: article.title,
      author: article.author,
      siteName: article.siteName,
      digest: article.digest,
      contentLength: article.content?.length || 0,
      imageCount: article.images?.length || 0,
      extractionMethod: article.extractionMethod,
      allKeys: Object.keys(article)
    });

    console.log('🔧 当前配置状态:', {
      strapiUrl: this.config.strapiUrl,
      collection: this.config.collection,
      fieldMappingEnabled: this.config.fieldMapping?.enabled,
      fieldPresetsEnabled: this.config.fieldPresets?.enabled,
      fieldMappingFields: this.config.fieldMapping?.fields ? Object.keys(this.config.fieldMapping.fields) : [],
      fieldPresets: this.config.fieldPresets?.presets ? Object.keys(this.config.fieldPresets.presets) : [],
      // 🖼️ 头图相关配置
      uploadHeadImg: this.config.advancedSettings?.uploadHeadImg,
      headImgIndex: this.config.advancedSettings?.headImgIndex,
      uploadImages: this.config.advancedSettings?.uploadImages,
      headImgField: this.config.fieldMapping?.fields?.headImg
    });

    try {
      // 🎯 使用shared模块的统一逻辑
      console.log('📤 调用 strapiIntegration.sendToStrapi...');
      const result = await this.strapiIntegration.sendToStrapi(article);
      
      console.log('✅ 文章上传成功 (共享模块):', {
        success: result.success,
        id: result.id,
        dataKeys: result.data ? Object.keys(result.data) : []
      });
      return result;

    } catch (error) {
      console.error('❌ 文章上传失败 (共享模块):', {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      throw error;
    }
  }

  /**
   * 提取文章进行预览（使用共享逻辑）
   */
  async extractForPreview(tabId) {
    console.log('=== 使用共享模块提取预览 ===');
    
    try {
      // 发送提取请求到content script
      const result = await this.sendMessageToTab(tabId, { 
        type: 'FULL_EXTRACT',
        options: {
          includeFullContent: true,
          includeImages: true,
          includeMetadata: true
        }
      });

      console.log('📨 收到content script响应:', {
        hasResult: !!result,
        resultType: typeof result,
        hasTitle: !!(result && result.title),
        hasData: !!(result && result.data),
        keys: result ? Object.keys(result) : []
      });

      // 处理不同的响应格式
      let article = null;
      if (result && result.success && result.data) {
        // 包装格式响应
        article = result.data;
        console.log('✅ 使用包装格式数据');
      } else if (result && result.title) {
        // 直接文章格式响应
        article = result;
        console.log('✅ 使用直接格式数据');
      } else {
        console.error('❌ 无效的响应格式:', result);
        throw new Error('没有提取到文章内容或响应格式无效');
      }

      if (!article || !article.title) {
        console.error('❌ 文章数据无效:', {
          hasArticle: !!article,
          articleKeys: article ? Object.keys(article) : [],
          title: article?.title,
          content: article?.content ? `${article.content.length} chars` : 'no content'
        });
        throw new Error('文章数据无效：缺少标题');
      }

      console.log('✅ 文章数据有效:', {
        title: article.title,
        contentLength: article.content?.length || 0,
        hasImages: !!(article.images && article.images.length > 0),
        extractionMethod: article.extractionMethod
      });

      // 🎯 跳过shared模块验证（避免二次验证导致的格式问题）
      // 直接返回提取到的数据，让popup.js处理显示
      return article;

    } catch (error) {
      console.error('❌ 预览提取失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送消息到Tab
   */
  async sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }
}

// 创建全局服务实例
const strapiService = new ChromeExtensionStrapiService();

// 消息监听器 - 简化版本，使用共享逻辑
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('📨 Background收到消息:', msg.type);

  if (msg.type === 'sendToStrapi') {
    strapiService.sendToStrapi(msg.article)
      .then(data => {
        console.log('✅ 共享模块上传成功:', data.id);
        sendResponse({ success: true, data });
      })
      .catch(err => {
        console.error('❌ 共享模块上传失败:', err.message);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
  
  if (msg.type === 'previewArticle') {
    strapiService.extractForPreview(msg.tabId)
      .then(article => {
        console.log('✅ 共享模块预览成功:', article.title);
        sendResponse({ success: true, data: article });
      })
      .catch(err => {
        console.error('❌ 共享模块预览失败:', err.message);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});

console.log('🚀 重构后的Background Script已加载 (使用共享模块)'); 