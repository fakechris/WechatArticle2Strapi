/**
 * Chrome扩展适配器
 * 桥接共享核心模块与浏览器扩展环境的特定需求
 */

import { createArticlePipeline } from '../../../shared/core/index.js';

export class ExtensionAdapter {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      debug: false,
      environment: 'browser',
      autoDetectWechat: true,
      ...options
    };

    // 创建处理管道
    this.pipeline = createArticlePipeline({
      environment: 'browser',
      verbose: this.options.verbose,
      debug: this.options.debug,
      strapi: this.options.strapiConfig,
      extractorOptions: {
        defuddleConfig: {
          removeExactSelectors: false,
          removePartialSelectors: false,
          minContentLength: 100
        }
      }
    });

    this.log('扩展适配器初始化完成');
  }

  /**
   * 从当前页面提取文章
   * @returns {Promise<Object>} 提取结果
   */
  async extractFromCurrentPage() {
    this.log('开始从当前页面提取文章');

    try {
      // 检查是否为微信文章页面
      if (this.options.autoDetectWechat && !this.isWeChatPage()) {
        throw new Error('当前页面不是微信文章页面');
      }

      // 等待页面完全加载
      await this.waitForPageReady();

      // 使用共享核心逻辑提取
      const result = await this.pipeline.process(document, window.location.href);

      // 扩展特定的增强处理
      result.article = await this.enhanceArticleForExtension(result.article);

      this.log('文章提取完成', { 
        title: result.article.title,
        contentLength: result.article.content?.length || 0,
        imagesCount: result.article.images?.length || 0
      });

      return result;

    } catch (error) {
      this.log(`提取失败: ${error.message}`, null, 'error');
      throw error;
    }
  }

  /**
   * 检查是否为微信文章页面
   * @returns {boolean} 是否为微信页面
   */
  isWeChatPage() {
    return window.location.hostname === 'mp.weixin.qq.com' ||
           window.location.hostname.includes('weixin.qq.com');
  }

  /**
   * 等待页面准备就绪
   * @returns {Promise<void>}
   */
  async waitForPageReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        // 额外等待微信页面的动态内容加载
        setTimeout(resolve, 500);
      } else {
        window.addEventListener('load', () => {
          setTimeout(resolve, 500);
        });
      }
    });
  }

  /**
   * 扩展特定的文章增强处理
   * @param {Object} article - 文章数据
   * @returns {Promise<Object>} 增强后的文章数据
   */
  async enhanceArticleForExtension(article) {
    this.log('执行扩展特定增强处理');

    // 增强图片处理（浏览器环境）
    if (article.images && article.images.length > 0) {
      article.images = await this.processImagesForExtension(article.images);
    }

    // 增强元数据
    article.extractionEnvironment = 'extension';
    article.userAgent = navigator.userAgent;
    article.extractedBy = 'wechat-article-extractor-extension';
    article.pageUrl = window.location.href;
    article.referrer = document.referrer;

    // 添加扩展特定的统计信息
    article.stats = {
      processingTime: Date.now() - (article.timestamp || Date.now()),
      wordCount: this.calculateWordCount(article.content),
      readingTime: this.calculateReadingTime(article.content),
      pageWidth: window.innerWidth,
      pageHeight: window.innerHeight,
      scrollPosition: window.scrollY
    };

    // 添加页面元信息
    article.pageMetadata = this.extractPageMetadata();

    return article;
  }

  /**
   * 扩展环境下的图片处理
   * @param {Array} images - 图片数组
   * @returns {Promise<Array>} 处理后的图片数组
   */
  async processImagesForExtension(images) {
    this.log(`处理 ${images.length} 张图片`);

    const processedImages = [];
    
    for (const image of images) {
      try {
        // 在浏览器环境中，我们可以：
        // 1. 获取图片的实际尺寸
        // 2. 检查图片是否已加载
        // 3. 生成缩略图（如果需要）
        
        const enhancedImage = await this.enhanceImageInfo(image);
        processedImages.push(enhancedImage);
        
      } catch (error) {
        this.log(`图片处理失败: ${image.src}`, error.message, 'warn');
        // 保留原始图片信息
        processedImages.push(image);
      }
    }

    this.log(`图片处理完成，处理了 ${processedImages.length} 张图片`);
    return processedImages;
  }

  /**
   * 增强图片信息
   * @param {Object} imageInfo - 原始图片信息
   * @returns {Promise<Object>} 增强后的图片信息
   */
  async enhanceImageInfo(imageInfo) {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          ...imageInfo,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          loaded: true,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          processedAt: new Date().toISOString()
        });
      };
      
      img.onerror = () => {
        resolve({
          ...imageInfo,
          loaded: false,
          error: 'Failed to load image',
          processedAt: new Date().toISOString()
        });
      };
      
      // 设置超时处理
      setTimeout(() => {
        resolve({
          ...imageInfo,
          loaded: false,
          error: 'Image load timeout',
          processedAt: new Date().toISOString()
        });
      }, 5000);
      
      img.src = imageInfo.src;
    });
  }

  /**
   * 提取页面元信息
   * @returns {Object} 页面元信息
   */
  extractPageMetadata() {
    return {
      title: document.title,
      description: this.getMetaContent('description'),
      keywords: this.getMetaContent('keywords'),
      ogTitle: this.getMetaContent('og:title'),
      ogDescription: this.getMetaContent('og:description'),
      ogImage: this.getMetaContent('og:image'),
      ogUrl: this.getMetaContent('og:url'),
      canonical: this.getCanonicalUrl(),
      charset: document.characterSet,
      lang: document.documentElement.lang,
      lastModified: document.lastModified
    };
  }

  /**
   * 获取meta标签内容
   * @param {string} name - meta标签名称
   * @returns {string} 内容
   */
  getMetaContent(name) {
    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return meta ? meta.content : '';
  }

  /**
   * 获取canonical URL
   * @returns {string} canonical URL
   */
  getCanonicalUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');
    return canonical ? canonical.href : '';
  }

  /**
   * 计算字数
   * @param {string} content - 内容
   * @returns {number} 字数
   */
  calculateWordCount(content) {
    if (!content) return 0;
    
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const chineseChars = (textContent.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (textContent.match(/[a-zA-Z]+/g) || []).length;
    
    return chineseChars + englishWords;
  }

  /**
   * 计算阅读时间（分钟）
   * @param {string} content - 内容
   * @returns {number} 阅读时间
   */
  calculateReadingTime(content) {
    const wordCount = this.calculateWordCount(content);
    const avgReadingSpeed = 400;
    return Math.max(1, Math.round(wordCount / avgReadingSpeed));
  }

  /**
   * 显示扩展内的提取结果
   * @param {Object} result - 提取结果
   */
  showExtractionResult(result) {
    const { article, strapi } = result;
    
    // 创建结果显示UI
    this.createResultUI(article, strapi);
    
    // 发送消息到background script（如果需要）
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'EXTRACTION_COMPLETE',
        data: {
          title: article.title,
          url: article.url,
          success: true,
          contentLength: article.content?.length || 0,
          imagesCount: article.images?.length || 0
        }
      });
    }
  }

  /**
   * 创建结果显示UI
   * @param {Object} article - 文章数据
   * @param {Object} strapi - Strapi结果
   */
  createResultUI(article, strapi) {
    // 创建悬浮窗口显示结果
    const resultPanel = document.createElement('div');
    resultPanel.id = 'wechat-extractor-result';
    resultPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      max-height: 400px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      background: #007cff;
      color: white;
      padding: 12px 16px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>📄 提取结果</span>
      <button id="close-result" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
      max-height: 320px;
      overflow-y: auto;
    `;

    const createInfoRow = (label, value) => `
      <div style="margin-bottom: 8px;">
        <strong>${label}:</strong> ${value || '未获取'}
      </div>
    `;

    content.innerHTML = `
      ${createInfoRow('标题', article.title)}
      ${createInfoRow('作者', article.author)}
      ${createInfoRow('内容长度', `${article.content?.length || 0} 字符`)}
      ${createInfoRow('图片数量', `${article.images?.length || 0} 张`)}
      ${createInfoRow('提取方法', article.extractionMethod)}
      ${strapi ? createInfoRow('Strapi状态', strapi.success ? '✅ 发送成功' : '❌ 发送失败') : ''}
    `;

    resultPanel.appendChild(header);
    resultPanel.appendChild(content);
    
    // 添加到页面
    document.body.appendChild(resultPanel);

    // 绑定关闭事件
    document.getElementById('close-result').addEventListener('click', () => {
      document.body.removeChild(resultPanel);
    });

    // 自动关闭
    setTimeout(() => {
      if (document.getElementById('wechat-extractor-result')) {
        document.body.removeChild(resultPanel);
      }
    }, 10000);
  }

  /**
   * 显示错误信息
   * @param {Error} error - 错误对象
   */
  showError(error) {
    // 创建错误提示UI
    const errorPanel = document.createElement('div');
    errorPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: #fff2f0;
      border: 1px solid #ffccc7;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #a8071a;
    `;

    errorPanel.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px;">❌ 提取失败</div>
      <div>${error.message}</div>
    `;

    document.body.appendChild(errorPanel);

    // 自动关闭
    setTimeout(() => {
      if (document.body.contains(errorPanel)) {
        document.body.removeChild(errorPanel);
      }
    }, 5000);

    // 发送错误消息到background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'EXTRACTION_ERROR',
        error: error.message
      });
    }
  }

  /**
   * 调试日志
   */
  log(message, data = null, level = 'info') {
    if (!this.options.verbose && level === 'info') return;
    if (!this.options.debug && level === 'debug') return;

    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [ExtensionAdapter]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ❌ ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️  ${message}`, data || '');
        break;
      case 'debug':
        console.log(`${prefix} 🔍 ${message}`, data || '');
        break;
      default:
        console.log(`${prefix} ${message}`, data || '');
    }
  }
} 