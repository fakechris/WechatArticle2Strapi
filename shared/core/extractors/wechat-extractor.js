/**
 * 统一的微信文章提取器
 * 合并CLI和Chrome Extension的最佳实践
 */

import { isValidImageUrl } from '../../utils/url-utils.js';
import { generateSlug } from '../../utils/slug-utils.js';
import { WECHAT_SELECTORS } from '../../constants/selectors.js';

export class WeChatExtractor {
  constructor(options = {}) {
    this.options = {
      debug: false,
      verbose: false,
      environment: 'browser', // 'browser' | 'node'
      defuddleConfig: {
        removeExactSelectors: false,  // 降低清理强度
        removePartialSelectors: false,
        minContentLength: 100
      },
      ...options
    };
  }

  /**
   * 主要提取方法
   * @param {Document} document - DOM文档对象
   * @param {string} url - 文章URL
   * @param {Object} context - 运行环境上下文
   * @returns {Promise<Object>} 提取结果
   */
  async extract(document, url, context = {}) {
    this.log('🚀 开始微信文章提取');
    this.log(`URL: ${url}`);
    this.log(`环境: ${this.options.environment}`);

    // 检测页面验证状态
    if (this.detectVerificationPage(document)) {
      throw new Error('微信页面需要环境验证，请在浏览器中完成验证后重试');
    }

    // 优先使用微信特定选择器
    const selectorResult = await this.extractWithSelectors(document, url);
    
    if (this.isContentSufficient(selectorResult)) {
      this.log('✅ 微信选择器提取成功');
      return this.normalizeResult(selectorResult, 'wechat-selectors');
    }

    // 回退到Defuddle增强提取
    this.log('📝 选择器结果不理想，尝试Defuddle增强提取');
    const defuddleResult = await this.extractWithDefuddle(document, url);
    
    if (this.isContentSufficient(defuddleResult)) {
      this.log('✅ Defuddle增强提取成功');
      return this.normalizeResult(defuddleResult, 'defuddle-enhanced-wechat');
    }

    // 最后回退到基础提取
    this.log('⚠️ 使用基础提取作为最后手段');
    const basicResult = this.extractBasic(document, url);
    return this.normalizeResult(basicResult, 'wechat-basic');
  }

  /**
   * 使用微信特定选择器提取
   */
  async extractWithSelectors(document, url) {
    this.log('🎯 使用微信特定选择器提取');

    // 标题提取 - 多个选择器优先级
    const titleEl = this.querySelector(document, WECHAT_SELECTORS.title);
    const title = titleEl ? titleEl.textContent?.trim() || '' : '';

    // 作者提取 - 优先获取公众号名称
    const authorEl = this.querySelector(document, WECHAT_SELECTORS.author);
    const author = authorEl ? authorEl.textContent?.trim() || '' : '';

    // 发布时间提取
    const publishTimeEl = this.querySelector(document, WECHAT_SELECTORS.publishTime);
    const publishTime = publishTimeEl ? publishTimeEl.textContent?.trim() || '' : '';

    // 内容提取 - 尝试多个容器
    const contentEl = this.querySelector(document, WECHAT_SELECTORS.content);
    let content = '';
    
    if (contentEl) {
      content = contentEl.innerHTML || '';
    } else {
      // 尝试从脚本标签提取（某些微信文章通过JS加载内容）
      content = this.extractFromScripts(document);
    }

    // 💡 修复digest提取逻辑 - 按照Chrome扩展的方式，META标签优先
    let digest = '';
    
    // 1. 优先使用META标签（最准确的摘要）
    const metaDesc = document.querySelector('meta[name="description"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    
    if (metaDesc) {
      digest = metaDesc.getAttribute('content') || '';
    } else if (ogDesc) {
      digest = ogDesc.getAttribute('content') || '';
    } else if (twitterDesc) {
      digest = twitterDesc.getAttribute('content') || '';
    }
    
    // 2. 如果META标签都没有，再使用微信特定选择器
    if (!digest) {
      const digestEl = this.querySelector(document, WECHAT_SELECTORS.digest);
      if (digestEl) {
        digest = (digestEl.content || digestEl.textContent || '').trim();
      }
    }
    
    // 3. 最后的回退：从内容中提取摘要
    if (!digest && content) {
      const textContent = content.replace(/<[^>]*>/g, '').trim();
      digest = textContent.substring(0, 150);
      if (textContent.length > 150) {
        digest += '...';
      }
    }

    // siteName提取 - 新增逻辑
    let siteName = '';
    // 优先从公众号名称获取
    if (author) {
      siteName = author;
    } else {
      // 尝试从其他元素提取
      const siteNameEl = document.querySelector('#js_name') || 
                        document.querySelector('.account_nickname_inner') ||
                        document.querySelector('[id*="account"]') ||
                        document.querySelector('[class*="account"]');
      if (siteNameEl) {
        siteName = siteNameEl.textContent?.trim() || '';
      }
      
      // 如果还是为空，从URL中提取或使用默认值
      if (!siteName) {
        if (url.includes('mp.weixin.qq.com')) {
          siteName = '微信公众号';
        } else {
          siteName = 'WeChat';
        }
      }
    }

    // 图片提取（异步）
    const images = await this.extractImages(contentEl || document, url);

    return {
      title,
      author,
      publishTime,
      content,
      digest,
      siteName,  // 新增字段
      images,
      url,
      slug: title ? generateSlug(title) : '',
      timestamp: Date.now()
    };
  }

  /**
   * 使用Defuddle增强提取
   */
  async extractWithDefuddle(document, url) {
    this.log('🔧 使用Defuddle增强提取');

    // 动态导入Defuddle（兼容不同环境）
    const Defuddle = await this.importDefuddle();
    
    const defuddle = new Defuddle(document, {
      debug: this.options.debug,
      ...this.options.defuddleConfig,
      // 微信特定配置
      contentSelector: WECHAT_SELECTORS.content.join(', '),
      titleSelector: WECHAT_SELECTORS.title.join(', '),
      authorSelector: WECHAT_SELECTORS.author.join(', ')
    });

    const result = defuddle.parse();
    
    if (!result) {
      throw new Error('Defuddle解析失败');
    }

    // 增强Defuddle结果
    return this.enhanceWithWeChatMetadata(result, document, url);
  }

  /**
   * 基础提取（最后手段）
   */
  extractBasic(document, url) {
    this.log('🔧 使用基础提取方法');

    // 尝试找到最大的文本块
    const allDivs = document.querySelectorAll('div, section, article');
    let maxLength = 0;
    let contentEl = null;

    for (const div of allDivs) {
      const textLength = div.innerText ? div.innerText.length : 0;
      if (textLength > maxLength && textLength > 200) {
        maxLength = textLength;
        contentEl = div;
      }
    }

    const title = document.title || '';
    const content = contentEl ? contentEl.innerHTML : '';
    const images = this.extractImages(contentEl || document, url);

    // 简单的siteName提取
    let siteName = '';
    if (url.includes('mp.weixin.qq.com')) {
      siteName = '微信公众号';
    } else {
      siteName = 'WeChat';
    }

    return {
      title,
      author: '',
      publishTime: '',
      content,
      digest: '',
      siteName,  // 新增字段
      images,
      url,
      slug: title ? generateSlug(title) : '',
      timestamp: Date.now()
    };
  }

  /**
   * 增强Defuddle结果with微信特定元数据
   */
  enhanceWithWeChatMetadata(defuddleResult, document, url) {
    const authorEl = this.querySelector(document, WECHAT_SELECTORS.author);
    const publishTimeEl = this.querySelector(document, WECHAT_SELECTORS.publishTime);
    const digestEl = this.querySelector(document, WECHAT_SELECTORS.digest);

    // siteName提取
    let siteName = defuddleResult.site || '';
    if (!siteName) {
      const author = defuddleResult.author || (authorEl ? authorEl.textContent?.trim() : '');
      if (author) {
        siteName = author;
      } else if (url.includes('mp.weixin.qq.com')) {
        siteName = '微信公众号';
      } else {
        siteName = 'WeChat';
      }
    }

    // 从清理后的内容中提取图片
    const images = this.extractImagesFromHTML(defuddleResult.content, url);

    return {
      title: defuddleResult.title || '',
      author: defuddleResult.author || (authorEl ? authorEl.textContent?.trim() : ''),
      publishTime: defuddleResult.published || (publishTimeEl ? publishTimeEl.textContent?.trim() : ''),
      content: defuddleResult.content || '',
      digest: defuddleResult.description || (digestEl ? (digestEl.content || digestEl.textContent || '').trim() : ''),
      siteName,  // 新增字段
      images: images,
      url: defuddleResult.url || url,
      slug: defuddleResult.title ? generateSlug(defuddleResult.title) : '',
      timestamp: Date.now(),
      wordCount: defuddleResult.wordCount || 0,
      parseTime: defuddleResult.parseTime || 0,
      domain: defuddleResult.domain || '',
      site: defuddleResult.site || ''
    };
  }

  /**
   * 图片提取（支持懒加载）- 增强版
   */
  async extractImages(container, baseUrl) {
    if (!container) return [];

    // 浏览器环境下先触发懒加载
    if (this.options.environment === 'browser') {
      await this.triggerLazyLoading(container);
    }

    const images = [];
    const seenUrls = new Set();

    // 支持多种图片选择器和懒加载属性
    const imgElements = container.querySelectorAll('img');
    
    imgElements.forEach((img, index) => {
      let src = this.getImageSrc(img);
      
      if (src && isValidImageUrl(src) && !seenUrls.has(src)) {
        seenUrls.add(src);
        
        images.push({
          src: src,
          alt: img.alt || '',
          index: images.length,
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          isLazyLoaded: this.isLazyLoadedImage(img),
          originalSrc: img.src,
          dataSrc: img.getAttribute('data-src')
        });
      }
    });

    // 额外处理背景图片
    const bgImages = this.extractBackgroundImages(container);
    bgImages.forEach(bgImg => {
      if (!seenUrls.has(bgImg.src)) {
        seenUrls.add(bgImg.src);
        images.push(bgImg);
      }
    });

    this.log(`📷 提取到 ${images.length} 张图片`);
    return images;
  }

  /**
   * 获取图片真实源地址（懒加载兼容）
   */
  getImageSrc(img) {
    // 优先级：data-src > data-original > data-lazy > src
    const lazySrcAttrs = [
      'data-src',
      'data-original', 
      'data-lazy',
      'data-url',
      'data-img-src'
    ];

    // 首先检查懒加载属性
    for (const attr of lazySrcAttrs) {
      const lazySrc = img.getAttribute(attr);
      if (lazySrc && !lazySrc.startsWith('data:') && !this.isPlaceholderSrc(lazySrc)) {
        return lazySrc;
      }
    }

    // 如果没有懒加载属性，或懒加载属性是占位符，则使用src
    const src = img.src || img.getAttribute('src');
    if (src && !src.startsWith('data:') && !this.isPlaceholderSrc(src)) {
      return src;
    }

    return null;
  }

  /**
   * 判断是否是占位符图片
   */
  isPlaceholderSrc(src) {
    if (!src) return true;
    
    const placeholderIndicators = [
      'placeholder',
      'loading',
      'blank',
      'transparent',
      '1x1',
      'spacer',
      'pixel.gif',
      'default.jpg'
    ];
    
    const srcLower = src.toLowerCase();
    return placeholderIndicators.some(indicator => srcLower.includes(indicator));
  }

  /**
   * 检查图片是否使用了懒加载
   */
  isLazyLoadedImage(img) {
    // 检查懒加载属性
    const lazyAttrs = ['data-src', 'data-original', 'data-lazy', 'loading'];
    const hasLazyAttr = lazyAttrs.some(attr => img.hasAttribute(attr));
    
    // 检查懒加载类名
    const lazyClasses = ['lazy', 'lazyload', 'lazy-load', 'img-lazy'];
    const hasLazyClass = lazyClasses.some(cls => img.classList.contains(cls));
    
    return hasLazyAttr || hasLazyClass;
  }

  /**
   * 浏览器环境下触发懒加载
   */
  async triggerLazyLoading(container) {
    if (this.options.environment !== 'browser') return;
    
    this.log('🔄 触发懒加载机制...');
    
    try {
      // 方法1：强制加载所有懒加载图片
      await this.forceLoadLazyImages(container);
      
      // 方法2：滚动触发（作为备用）
      await this.scrollToTriggerLazyLoad();
      
      // 等待一段时间让图片加载
      await this.sleep(1000);
      
      this.log('✅ 懒加载触发完成');
    } catch (error) {
      this.log(`⚠️ 懒加载触发失败: ${error.message}`);
    }
  }

  /**
   * 强制加载懒加载图片
   */
  async forceLoadLazyImages(container) {
    const lazyImages = container.querySelectorAll('img[data-src], img[data-original], img[data-lazy]');
    
    let loadedCount = 0;
    const loadPromises = [];
    
    lazyImages.forEach(img => {
      const dataSrc = img.getAttribute('data-src') || 
                     img.getAttribute('data-original') || 
                     img.getAttribute('data-lazy');
      
      if (dataSrc && !this.isPlaceholderSrc(dataSrc)) {
        const loadPromise = new Promise((resolve) => {
          const originalSrc = img.src;
          
          img.onload = () => {
            loadedCount++;
            resolve();
          };
          
          img.onerror = () => {
            // 加载失败时恢复原始src
            img.src = originalSrc;
            resolve();
          };
          
          // 触发加载
          img.src = dataSrc;
          img.removeAttribute('data-src');
          img.removeAttribute('data-original');
          img.removeAttribute('data-lazy');
        });
        
        loadPromises.push(loadPromise);
      }
    });
    
    if (loadPromises.length > 0) {
      await Promise.allSettled(loadPromises);
      this.log(`🖼️ 强制加载了 ${loadedCount} 张懒加载图片`);
    }
  }

  /**
   * 滚动页面触发懒加载
   */
  async scrollToTriggerLazyLoad() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const originalScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // 滚动到页面底部
    const scrollHeight = document.body.scrollHeight;
    const steps = 5;
    const stepSize = scrollHeight / steps;
    
    for (let i = 0; i <= steps; i++) {
      const scrollTo = i * stepSize;
      window.scrollTo(0, scrollTo);
      await this.sleep(200); // 等待懒加载触发
    }
    
    // 恢复原始滚动位置
    window.scrollTo(0, originalScrollTop);
  }

  /**
   * 提取背景图片
   */
  extractBackgroundImages(container) {
    const bgImages = [];
    const elementsWithBg = container.querySelectorAll('[style*="background-image"]');
    
    elementsWithBg.forEach((el, index) => {
      const style = el.style.backgroundImage || el.getAttribute('style') || '';
      const match = style.match(/url\(['"]?([^'"()]+)['"]?\)/);
      
      if (match && match[1] && isValidImageUrl(match[1])) {
        bgImages.push({
          src: match[1],
          alt: el.getAttribute('alt') || '',
          index: index,
          width: 0,
          height: 0,
          isBackgroundImage: true
        });
      }
    });
    
    return bgImages;
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 从HTML字符串中提取图片
   */
  extractImagesFromHTML(htmlContent, baseUrl) {
    if (!htmlContent) return [];

    // 创建临时DOM容器
    const tempDiv = this.options.environment === 'browser' ? 
      document.createElement('div') : 
      this.createTempElement(htmlContent);
    
    if (this.options.environment === 'browser') {
      tempDiv.innerHTML = htmlContent;
    }

    return this.extractImages(tempDiv, baseUrl);
  }

  /**
   * 从脚本标签提取内容（某些微信文章）
   */
  extractFromScripts(document) {
    const scripts = document.querySelectorAll('script');
    
    for (const script of scripts) {
      const scriptText = script.textContent || '';
      if (scriptText.includes('msg_content') || scriptText.includes('content_info')) {
        const contentMatch = scriptText.match(/content['"]\s*:\s*['"]([^'"]+)['"]/);
        if (contentMatch) {
          return contentMatch[1];
        }
      }
    }
    
    return '';
  }

  /**
   * 检测页面是否需要验证
   */
  detectVerificationPage(document) {
    const verificationIndicators = [
      '.weui-msg',
      '[class*="verification"]',
      '[class*="verify"]'
    ];

    return verificationIndicators.some(selector => 
      document.querySelector(selector)
    );
  }

  /**
   * 判断内容是否充足
   */
  isContentSufficient(result) {
    if (!result || !result.content) return false;
    
    // 内容长度检查
    if (result.content.length < this.options.defuddleConfig.minContentLength) {
      return false;
    }

    // 检查是否只是HTML骨架
    const textContent = result.content.replace(/<[^>]*>/g, '').trim();
    if (textContent.length < 50) {
      return false;
    }

    return true;
  }

  /**
   * 标准化输出结果
   */
  normalizeResult(result, method) {
    return {
      ...result,
      extractionMethod: method,
      extractedAt: new Date().toISOString(),
      environment: this.options.environment
    };
  }

  /**
   * 通用选择器查询（支持数组）
   */
  querySelector(document, selectors) {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    
    for (const selector of selectorArray) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    
    return null;
  }

  /**
   * 环境适配的Defuddle导入
   */
  async importDefuddle() {
    if (this.options.environment === 'browser') {
      // 浏览器环境，假设已经全局可用
      return window.Defuddle || Defuddle;
    } else {
      // Node.js环境
      const { default: Defuddle } = await import('defuddle');
      return Defuddle;
    }
  }

  /**
   * Node.js环境创建临时元素
   */
  createTempElement(htmlContent) {
    if (this.options.environment === 'node') {
      // Node.js环境下的简化实现
      // 实际项目中可以集成JSDOM
      return {
        innerHTML: htmlContent,
        querySelectorAll: () => [], // 简化实现
        querySelector: () => null
      };
    }
    
    // 浏览器环境
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    return div;
  }

  /**
   * 调试日志
   */
  log(message) {
    if (this.options.verbose || this.options.debug) {
      console.log(`[WeChatExtractor] ${message}`);
    }
  }
} 