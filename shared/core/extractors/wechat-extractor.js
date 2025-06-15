/**
 * 统一的微信文章提取器
 * 合并CLI和Chrome Extension的最佳实践
 */

import { isValidImageUrl } from '../../utils/url-utils.js';
import { generateSlug } from '../../utils/slug-utils.js';
import { WECHAT_SELECTORS, SITE_SPECIFIC_SELECTORS, CLEANUP_SELECTORS } from '../../constants/selectors.js';

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
    const basicResult = await this.extractBasic(document, url);
    return this.normalizeResult(basicResult, 'wechat-basic');
  }

  /**
   * 使用网站特定选择器提取
   */
  async extractWithSelectors(document, url) {
    this.log('🎯 使用网站特定选择器提取');

    // 获取网站特定的选择器
    const selectors = this.getSiteSelectors(url);
    
    // 标题提取 - 多个选择器优先级
    const titleEl = this.querySelector(document, selectors.title);
    let title = titleEl ? titleEl.textContent?.trim() || '' : '';
    
    // 如果所有选择器都失败，使用document.title作为后备
    if (!title) {
      title = document.title?.trim() || '';
      if (title) {
        this.log(`🔄 使用document.title作为后备标题: "${title}"`);
      }
    }
    
    // 调试信息
    if (this.options.debug) {
      this.log(`🔍 标题提取调试: 找到元素=${!!titleEl}, 标题="${title}"`);
      if (!titleEl && !title) {
        this.log(`🔍 尝试的标题选择器: ${selectors.title.join(', ')}`);
      }
    }

    // 作者提取
    const authorEl = this.querySelector(document, selectors.author);
    const author = authorEl ? authorEl.textContent?.trim() || '' : '';

    // 发布时间提取
    const publishTimeEl = this.querySelector(document, selectors.publishTime);
    const publishTime = publishTimeEl ? publishTimeEl.textContent?.trim() || '' : '';

    // 内容提取 - 尝试多个容器
    const contentEl = this.querySelector(document, selectors.content);
    let content = '';
    
    if (contentEl) {
      content = contentEl.innerHTML || '';
    } else {
      // 尝试从脚本标签提取（某些微信文章通过JS加载内容）
      content = this.extractFromScripts(document);
    }
    
    // 清理提取的内容，移除噪音元素
    if (content) {
      content = this.cleanExtractedContent(content, url, document);
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
    
    // 3. 最后的回退：从内容中提取摘要（过滤掉脚本内容）
    if (!digest && content) {
      // 创建临时元素来解析HTML并移除脚本
      const tempDiv = this.createTempElement(content);
      
      // 移除所有脚本、样式和噪音元素
      const scriptsAndStyles = tempDiv.querySelectorAll('script, style, noscript, input, meta, link');
      scriptsAndStyles.forEach(el => el.remove());
      
      // 获取纯文本内容
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      const cleanText = textContent.replace(/\s+/g, ' ').trim();
      
      // 过滤掉明显的脚本内容和找到实际的文章段落
      if (cleanText && !this.isScriptContent(cleanText)) {
        // 尝试找到第一个有意义的段落作为摘要
        const sentences = cleanText.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
        if (sentences.length > 0) {
          let summary = sentences[0].trim();
          if (summary.length > 150) {
            summary = summary.substring(0, 150) + '...';
          } else if (sentences.length > 1 && summary.length < 100) {
            // 如果第一句话太短，尝试加上第二句
            const secondSentence = sentences[1].trim();
            if (summary.length + secondSentence.length < 150) {
              summary += '。' + secondSentence;
            }
          }
          digest = summary;
        } else {
          // 后备方案：使用前150个字符
          digest = cleanText.substring(0, 150);
          if (cleanText.length > 150) {
            digest += '...';
          }
        }
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

    // 图片提取（异步） - 🆕 传入 document 参数以支持 og:image 提取
    const images = await this.extractImages(contentEl || document, url, selectors.imageContainers, document);

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
   * 获取网站特定的选择器
   */
  getSiteSelectors(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // 检查是否有网站特定的选择器
      for (const [sitePattern, selectors] of Object.entries(SITE_SPECIFIC_SELECTORS)) {
        if (hostname.includes(sitePattern)) {
          this.log(`🎯 使用 ${sitePattern} 的专用选择器`);
          return selectors;
        }
      }
      
      // 默认使用微信选择器
      this.log('🎯 使用默认微信选择器');
      return WECHAT_SELECTORS;
    } catch (error) {
      this.log(`获取选择器时出错: ${error.message}`, null, 'warn');
      return WECHAT_SELECTORS;
    }
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
    return await this.enhanceWithWeChatMetadata(result, document, url);
  }

  /**
   * 基础提取（最后手段）
   */
  async extractBasic(document, url) {
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
    const images = await this.extractImages(contentEl || document, url, null, document);

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
  async enhanceWithWeChatMetadata(defuddleResult, document, url) {
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

    // 从清理后的内容中提取图片 - 🆕 传入 document 参数以支持 og:image 提取
    const images = await this.extractImagesFromHTML(defuddleResult.content, url, document);

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
  async extractImages(container, baseUrl, imageContainerSelectors = null, document = null) {
    if (!container) return [];
    
    const images = [];
    const seenUrls = new Set();

    // 🆕 首先检查 og:image，如果存在，优先处理并设置为头图
    if (document) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        const ogImageUrl = ogImage.getAttribute('content');
        if (ogImageUrl && isValidImageUrl(ogImageUrl) && !seenUrls.has(ogImageUrl)) {
          seenUrls.add(ogImageUrl);
          
          // 将 og:image 作为第一张图片，并标记为头图
          images.push({
            src: this.normalizeImageUrl(ogImageUrl),
            alt: 'Head image from og:image',
            index: 0,
            width: 0,
            height: 0,
            isLazyLoaded: false,
            originalSrc: ogImageUrl,
            dataSrc: null,
            isHeadImage: true, // 🆕 标记为头图
            source: 'og:image' // 🆕 标记来源
          });
          
          this.log(`📸 发现并添加 og:image 作为头图: ${ogImageUrl.substring(0, 60)}...`);
        }
      }
    }
    
    // 如果提供了特定的图片容器选择器，优先使用
    let imageContainer = container;
    if (imageContainerSelectors && Array.isArray(imageContainerSelectors)) {
      for (const selector of imageContainerSelectors) {
        const specificContainer = container.querySelector ? container.querySelector(selector) : null;
        if (specificContainer) {
          imageContainer = specificContainer;
          this.log(`🖼️ 使用特定图片容器: ${selector}`);
          break;
        }
      }
    }

    // 浏览器环境下先触发懒加载
    if (this.options.environment === 'browser') {
      await this.triggerLazyLoading(imageContainer);
    }

    // 支持多种图片选择器和懒加载属性
    const imgElements = imageContainer.querySelectorAll('img');
    
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
          dataSrc: img.getAttribute('data-src'),
          isHeadImage: false, // 🆕 默认非头图
          source: 'content' // 🆕 标记来源
        });
      }
    });

    // 额外处理背景图片
    const bgImages = this.extractBackgroundImages(imageContainer);
    bgImages.forEach(bgImg => {
      if (!seenUrls.has(bgImg.src)) {
        seenUrls.add(bgImg.src);
        images.push({
          ...bgImg,
          isHeadImage: false, // 🆕 默认非头图
          source: 'background' // 🆕 标记来源
        });
      }
    });

    this.log(`📷 提取到 ${images.length} 张图片 (包含 og:image: ${images.some(img => img.source === 'og:image')})`);
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
        return this.normalizeImageUrl(lazySrc);
      }
    }

    // 如果没有懒加载属性，或懒加载属性是占位符，则使用src
    const src = img.src || img.getAttribute('src');
    if (src && !src.startsWith('data:') && !this.isPlaceholderSrc(src)) {
      return this.normalizeImageUrl(src);
    }

    return null;
  }

  /**
   * 规范化图片URL，处理协议相对URL
   */
  normalizeImageUrl(url) {
    if (!url) return url;
    
    // 处理协议相对URL（以 // 开头）
    if (url.startsWith('//')) {
      // 默认使用 HTTPS 协议
      return 'https:' + url;
    }
    
    return url;
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
          let resolved = false;
          
          // 设置超时，防止无限等待
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              this.log(`⚠️ 图片加载超时: ${dataSrc}`);
              resolve();
            }
          }, 5000); // 5秒超时
          
          img.onload = () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              loadedCount++;
              resolve();
            }
          };
          
          img.onerror = () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              // 加载失败时恢复原始src
              img.src = originalSrc;
              resolve();
            }
          };
          
          // 在CLI环境中，图片加载可能不会触发onload/onerror事件
          // 直接更新src并认为成功
          try {
            img.src = dataSrc;
            img.removeAttribute('data-src');
            img.removeAttribute('data-original');
            img.removeAttribute('data-lazy');
            
            // 在非真实浏览器环境中，立即resolve
            if (this.options.environment === 'browser' && typeof window !== 'undefined' && window.location) {
              // 真实浏览器环境，等待图片加载
            } else {
              // CLI/JSDOM环境，立即成功
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                loadedCount++;
                resolve();
              }
            }
          } catch (error) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              this.log(`图片处理出错: ${error.message}`);
              resolve();
            }
          }
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
    // 在CLI环境中（包括Playwright的Node.js端），跳过滚动逻辑
    // 因为JSDOM不支持真正的滚动操作
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    // 检查是否在真正的浏览器环境中（而不是JSDOM）
    try {
      if (!window.scrollTo || typeof window.scrollTo !== 'function') {
        this.log('⚠️ 跳过滚动触发（非真实浏览器环境）');
        return;
      }
      
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
    } catch (error) {
      this.log(`⚠️ 滚动触发失败，跳过: ${error.message}`);
    }
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
   * 判断文本是否是脚本内容
   */
  isScriptContent(text) {
    if (!text || typeof text !== 'string') return true;
    
    const scriptIndicators = [
      'document.domain',
      'function(',
      'var ',
      'let ',
      'const ',
      '= function',
      'createElement',
      'getElementById',
      'addEventListener',
      'window.',
      'console.',
      'setTimeout',
      'setInterval',
      '._hmt',
      'baidu',
      'google',
      'analytics'
    ];
    
    const textLower = text.toLowerCase();
    const scriptSignals = scriptIndicators.filter(indicator => 
      textLower.includes(indicator.toLowerCase())
    );
    
    // 如果包含超过2个脚本特征，认为是脚本内容
    return scriptSignals.length >= 2;
  }

  /**
   * 从HTML字符串中提取图片
   */
  async extractImagesFromHTML(htmlContent, baseUrl, document = null) {
    if (!htmlContent) return [];

    // 创建临时DOM容器 - 安全地处理不同环境
    let tempDiv;
    if (this.options.environment === 'browser' && typeof document !== 'undefined') {
      // 真正的浏览器环境
      tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
    } else {
      // CLI/Node.js环境，使用简化实现
      tempDiv = this.createTempElement(htmlContent);
    }

    return await this.extractImages(tempDiv, baseUrl, null, document);
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
    // 更智能的验证页面检测逻辑
    // 不仅检查元素存在，还要检查关键文本内容
    
    const verificationKeywords = [
      '环境异常',
      '完成验证后即可继续访问',
      '请完成验证',
      '安全验证',
      '网络环境异常',
      '请在微信客户端打开',
      '访问过于频繁'
    ];
    
    // 1. 首先检查页面文本是否包含验证相关关键词
    const bodyText = document.body ? document.body.textContent || '' : '';
    const hasVerificationText = verificationKeywords.some(keyword => 
      bodyText.includes(keyword)
    );
    
    // 2. 检查是否有文章内容容器
    const contentSelectors = [
      '#js_content',
      '.rich_media_content', 
      '[id*="content"]',
      '.article-content'
    ];
    
    const hasContentContainer = contentSelectors.some(selector => {
      const element = document.querySelector(selector);
      return element && element.textContent && element.textContent.trim().length > 100;
    });
    
    // 3. 检查页面标题是否正常
    const title = document.title || '';
    const hasNormalTitle = title && !title.includes('验证') && !title.includes('异常');
    
    // 判断逻辑：
    // - 如果有验证文本且没有正常内容，认为是验证页面
    // - 如果有正常的文章内容和标题，即使有weui-msg也不认为是验证页面
    if (hasVerificationText && !hasContentContainer) {
      this.log('检测到验证页面：包含验证关键词且缺少文章内容');
      return true;
    }
    
    if (hasContentContainer && hasNormalTitle) {
      this.log('检测到正常文章页面：有内容容器和正常标题');
      return false;
    }
    
    // 回退到原有逻辑，但更谨慎
    const verificationIndicators = [
      '.weui-msg',
      '[class*="verification"]',
      '[class*="verify"]'
    ];
    
    const hasVerificationElements = verificationIndicators.some(selector => {
      const element = document.querySelector(selector);
      if (!element) return false;
      
      // 检查元素内容是否真的是验证相关
      const elementText = element.textContent || '';
      return verificationKeywords.some(keyword => elementText.includes(keyword));
    });
    
    if (hasVerificationElements) {
      this.log('检测到验证页面：验证元素包含关键词');
      return true;
    }
    
    return false;
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
    // 🆕 处理头图逻辑
    let head_img = null;
    if (result.images && result.images.length > 0) {
      // 查找标记为头图的图片（通常是og:image）
      const headImage = result.images.find(img => img.isHeadImage);
      if (headImage) {
        head_img = headImage.src;
        this.log(`✅ 设置头图: ${head_img.substring(0, 60)}... (来源: ${headImage.source})`);
      } else {
        // 如果没有明确的头图，使用第一张有效图片作为头图
        const firstValidImage = result.images.find(img => img.src && img.src.length > 0);
        if (firstValidImage) {
          head_img = firstValidImage.src;
          this.log(`📸 使用第一张图片作为头图: ${head_img.substring(0, 60)}...`);
        }
      }
    }

    return {
      ...result,
      head_img, // 🆕 添加头图字段
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
      // 浏览器环境，安全地检查window和Defuddle的可用性
      if (typeof window !== 'undefined' && window.Defuddle) {
        return window.Defuddle;
      }
      // 如果window不可用或没有Defuddle，回退到动态导入
      try {
        const { default: Defuddle } = await import('defuddle');
        return Defuddle;
      } catch (error) {
        console.error('Failed to import Defuddle in browser environment:', error);
        throw new Error('Defuddle is not available in this environment');
      }
    } else {
      // Node.js环境
      const { default: Defuddle } = await import('defuddle');
      return Defuddle;
    }
  }

  /**
   * 环境适配的临时元素创建
   */
  createTempElement(htmlContent, documentObj = null) {
    if (this.options.environment === 'browser') {
      // 浏览器环境 - 使用传入的document或全局document
      const doc = documentObj || (typeof document !== 'undefined' ? document : null);
      if (doc) {
        const div = doc.createElement('div');
        div.innerHTML = htmlContent;
        return div;
      }
    }
    
    // Node.js环境下的简化实现
    // 实际项目中可以集成JSDOM
    return {
      innerHTML: htmlContent,
      querySelectorAll: () => [], // 简化实现
      querySelector: () => null,
      remove: () => {},
      textContent: htmlContent.replace(/<[^>]*>/g, ''), // 简单的HTML标签移除
      childNodes: [],
      children: []
    };
  }

  /**
   * 调试日志
   */
  log(message) {
    if (this.options.verbose || this.options.debug) {
      console.log(`[WeChatExtractor] ${message}`);
    }
  }

  /**
   * 清理提取的内容，移除噪音元素
   */
  cleanExtractedContent(content, url, documentObj = null) {
    if (!content) return '';
    
    try {
      // 微信公众号文章不需要额外清理，它们通常已经很干净了
      if (url.includes('mp.weixin.qq.com')) {
        return content;
      }
      
      // 创建临时DOM元素进行清理
      const tempDiv = this.createTempElement(content, documentObj);
      
      // 1. 使用现有的通用清理规则
      this.applyCleanupRules(tempDiv, url);
      
      // 2. 移除模板语法内容（通用检测）
      this.removeTemplateContent(tempDiv, documentObj);
      
      // 3. 清理空白元素
      this.removeEmptyElements(tempDiv);
      
      return tempDiv.innerHTML;
      
    } catch (error) {
      this.log(`内容清理出错: ${error.message}`, null, 'warn');
      return content; // 出错时返回原内容
    }
  }

  /**
   * 应用现有的清理规则
   */
  applyCleanupRules(tempDiv, url) {
    // 应用通用清理规则
    CLEANUP_SELECTORS.general.forEach(selector => {
      const elements = tempDiv.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // 额外的通用噪音元素
    const additionalSelectors = [
      'input[type="hidden"]',
      'meta',
      'link', 
      'template',
      '[class*="comment"]',
      '[class*="share"]',
      '[id*="comment"]',
      '[id*="share"]'
    ];
    
    additionalSelectors.forEach(selector => {
      const elements = tempDiv.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  }

  /**
   * 移除包含模板语法的内容
   */
  removeTemplateContent(tempDiv, documentObj = null) {
    const allTextNodes = this.getAllTextNodes(tempDiv);
    
    allTextNodes.forEach(node => {
      const text = node.textContent || '';
      if (this.containsTemplateCode(text)) {
        // 移除包含模板代码的父元素
        let parent = node.parentElement;
        if (parent && parent !== tempDiv) {
          if (parent.remove) {
            parent.remove();
          } else if (parent.parentNode) {
            parent.parentNode.removeChild(parent);
          }
        }
      }
    });
    
    // 清理HTML中残留的模板语法
    if (tempDiv.innerHTML) {
      tempDiv.innerHTML = tempDiv.innerHTML
        .replace(/<%[\s\S]*?%>/g, '')      // EJS模板
        .replace(/\{\{[\s\S]*?\}\}/g, '')   // Handlebars/Vue模板
        .replace(/[^<>\n]{800,}/g, '');     // 过长的单行内容（可能是脚本）
    }
  }

  /**
   * 获取所有文本节点
   */
  getAllTextNodes(element) {
    const textNodes = [];
    
    // 环境适配的文本节点遍历
    if (this.options.environment === 'browser') {
      try {
        // 浏览器环境或支持TreeWalker的环境
        const doc = element.ownerDocument;
        const NodeFilterConst = doc.defaultView.NodeFilter || { SHOW_TEXT: 4 };
        
        const walker = doc.createTreeWalker(
          element,
          NodeFilterConst.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node);
        }
      } catch (error) {
        this.log(`TreeWalker出错，回退到递归方法: ${error.message}`);
        // 回退到递归方法
        this.recursiveTextNodeSearch(element, textNodes);
      }
    } else {
      // Node.js环境的递归实现
      this.recursiveTextNodeSearch(element, textNodes);
    }
    
    return textNodes;
  }
  
  /**
   * 递归搜索文本节点
   */
  recursiveTextNodeSearch(node, textNodes) {
    if (node.nodeType === 3) { // TEXT_NODE
      textNodes.push(node);
    }
    for (let child of node.childNodes || []) {
      this.recursiveTextNodeSearch(child, textNodes);
    }
  }

  /**
   * 移除空白元素
   */
  removeEmptyElements(tempDiv) {
    // 多次清理，因为移除元素后可能产生新的空元素
    for (let i = 0; i < 3; i++) {
      const emptyElements = tempDiv.querySelectorAll('*');
      let removed = false;
      
      emptyElements.forEach(el => {
        const text = el.textContent?.trim() || '';
        const hasImages = el.querySelectorAll('img').length > 0;
        const hasInputs = el.querySelectorAll('input, textarea, select').length > 0;
        
        // 只移除真正空白且没有有用内容的元素
        if (!text && !hasImages && !hasInputs && 
            (text === '' || text === '\u00A0' || text === '&nbsp;')) {
          el.remove();
          removed = true;
        }
      });
      
      if (!removed) break; // 如果没有移除任何元素，停止循环
    }
  }

  /**
   * 检查文本是否包含模板代码（简化版本）
   */
  containsTemplateCode(text) {
    if (!text || typeof text !== 'string' || text.length < 20) return false;
    
    // 简化的模板检测：只检测最明显的特征
    const hasTemplateDelimiters = /<%|%>|\{\{|\}\}/.test(text);
    const hasJavaScript = /function\s*\(|var\s+\w+\s*=|document\.|window\./.test(text);
    const isLongSingleLine = text.length > 500 && text.split('\n').length < 3;
    
    return hasTemplateDelimiters || (hasJavaScript && isLongSingleLine);
  }
} 