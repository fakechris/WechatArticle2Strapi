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

    // 关键修复：在任何提取操作之前，先对整个文档进行清理
    this.log('🔬 Pre-cleaning the entire document before extraction...');
    this.removeTemplateCodeNodes(document.body); // 移除模板脚本
    this.removeJunkElements(document.body);      // 移除广告、页脚等垃圾内容
    this.log('✅ Document pre-cleaning complete.');

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
    
    // 3. 如果仍然没有摘要，保持为空（不从内容中强制提取）
    // 这避免了从整个页面内容中错误提取摘要的问题

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
    // 图片提取，并获取渲染后的HTML
    const { images: extractedImagesArray, renderedHTML: updatedHtmlContent } = await this.extractImages(contentEl || document, url, selectors.imageContainers, document);

    return {
      title,
      author,
      publishTime,
      content: updatedHtmlContent, // 使用渲染后的HTML作为内容
      digest,
      siteName,  // 新增字段
      images: extractedImagesArray, // 使用提取到的图片数组
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
    const imageExtractionResult = await this.extractImagesFromHTML(defuddleResult.content, url, document);
    const images = imageExtractionResult.images;
    const updatedContent = imageExtractionResult.updatedHtmlContent;

    return {
      title: defuddleResult.title || '',
      author: defuddleResult.author || (authorEl ? authorEl.textContent?.trim() : ''),
      publishTime: defuddleResult.published || (publishTimeEl ? publishTimeEl.textContent?.trim() : ''),
      content: updatedContent,
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
    return { images: images, renderedHTML: container.innerHTML };
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
    if (!htmlContent) return { images: [], updatedHtmlContent: htmlContent };

    // 创建临时DOM容器 - 安全地处理不同环境
    let tempDiv;
    if (this.options.environment === 'browser' && typeof document !== 'undefined') {
      // 真正的浏览器环境
      tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
    } else {
      // CLI/Node.js环境，使用简化实现
      // Ensure createTempElement returns a valid container, or handle its absence
      tempDiv = this.createTempElement(htmlContent);
      if (!tempDiv || typeof tempDiv.innerHTML === 'undefined') {
        // If tempDiv is not valid (e.g., htmlContent was empty or createTempElement failed),
        // return original content with no images.
        this.log('Warning: Could not create tempDiv for HTML content in extractImagesFromHTML.', 'warn', 'extractImagesFromHTML');
        return { images: [], updatedHtmlContent: htmlContent };
      }
    }

    const extractionResult = await this.extractImages(tempDiv, baseUrl, null, document);
    // Ensure extractionResult and its properties are valid before accessing
    const images = extractionResult && extractionResult.images ? extractionResult.images : [];
    // If container.innerHTML was null or undefined (e.g. if container was not a valid element or extractImages failed to return it),
    // fall back to original htmlContent.
    const renderedHTML = extractionResult && typeof extractionResult.renderedHTML === 'string' ? extractionResult.renderedHTML : htmlContent;

    return {
      images: images,
      updatedHtmlContent: renderedHTML
    };
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
   * Creates a temporary DOM element from an HTML string to allow for DOM manipulation.
   * This is crucial for cleaning up the extracted content.
   */
  createTempElement(htmlContent, documentObj = null) {
    // In a Node.js environment, we must use JSDOM to create a full DOM.
    if (this.options.environment === 'node' || !documentObj) {
      try {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(`<!DOCTYPE html><body>${htmlContent}</body>`);
        // We return the body element, which contains our parsed HTML.
        return dom.window.document.body;
      } catch (e) {
        this.log('Error requiring or using JSDOM. Please ensure it is installed (`npm install jsdom`).', e, 'error');
        // As a fallback, return a mock object to prevent crashes, though cleanup will be skipped.
        return { innerHTML: htmlContent, querySelectorAll: () => [], querySelector: () => null };
      }
    }

    // In a browser environment, use the provided document object.
    const tempDiv = documentObj.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv;
  }

  /**
   * 调试日志
   */
  log(message, data = null, level = 'info') {
    if (this.options.verbose || this.options.debug) {
      if (data) {
        console.log(`[WeChatExtractor] ${message}`, data);
      } else {
        console.log(`[WeChatExtractor] ${message}`);
      }
    }
  }

  /**
   * Cleans the extracted HTML content by removing noise, templates, and junk elements.
   * Follows a structured, multi-step process for robustness.
   */
  cleanExtractedContent(htmlContent, url, document) {
    this.log('--- Starting HTML Content Cleanup ---', { url }, 'debug');
    if (!htmlContent) return '';

    try {
      const initialLength = htmlContent.length;
      this.log(`🧹 Starting HTML cleanup. Initial length: ${initialLength}`, null, 'debug');

      // Step 1: Create a DOM structure to work with.
      const tempDiv = this.createTempElement(htmlContent, document);

      // Step 2: Perform DOM-based cleanup. This is safer for complex structures.
      this.removeJunkElements(tempDiv); // Remove ads, footers, etc.
      this.removeTemplateCodeNodes(tempDiv); // Remove <script> tags with templates.

      // Step 3: Serialize back to an HTML string.
      let cleanedHtml = tempDiv.innerHTML;
      this.log(`📊 Length after initial DOM cleanup: ${cleanedHtml.length}`, null, 'debug');

      // Step 4: Perform regex-based cleanup as a final fallback for anything the DOM parser missed.
      cleanedHtml = this.removeTemplateContent(cleanedHtml);
      
      // Step 5: Final pass to remove empty tags created by the cleanup process.
      const finalDiv = this.createTempElement(cleanedHtml, document);
      this.removeEmptyElements(finalDiv);
      
      const finalContent = finalDiv.innerHTML;
      this.log(`✅ Cleanup complete. Final length: ${finalContent.length} (Total removed: ${initialLength - finalContent.length} chars)`, null, 'debug');
      
      return finalContent;

    } catch (error) {
      this.log(`❌ Content cleanup failed: ${error.message}`, { stack: error.stack }, 'error');
      return htmlContent; // Return original content on failure.
    }
  }

  /**
   * Removes common junk elements like ads, comments, and footers using selectors.
   */
  removeJunkElements(tempDiv) {
    this.log('[DOM Cleanup] Removing junk elements...', null, 'debug');
    let totalRemoved = 0;
    const selectors = [
      ...CLEANUP_SELECTORS.general,
      'input[type="hidden"]',
      'meta',
      'link',
      'template',
      '[class*="comment"]',
      '[class*="share"]',
      '[id*="comment"]',
      '[id*="share"]'
    ];

    selectors.forEach(selector => {
      const elements = tempDiv.querySelectorAll(selector);
      if (elements.length > 0) {
        this.log(`[DOM Cleanup] Removing ${elements.length} element(s) matching selector: "${selector}"`, null, 'debug');
        elements.forEach(el => el.remove());
        totalRemoved += elements.length;
      }
    });
    this.log(`[DOM Cleanup] Finished removing junk elements. Total removed: ${totalRemoved}.`, null, 'debug');
  }

  /**
   * Removes <script> tags that are either templates or contain template-like code.
   * This is a DOM-based operation.
   */
  removeTemplateCodeNodes(tempDiv) {
    this.log('[DOM Cleanup] Starting DOM-based script removal...', null, 'debug');
    const scripts = tempDiv.querySelectorAll('script');
    let removedCount = 0;

    if (scripts.length === 0) {
      this.log('[DOM Cleanup] No <script> tags found to inspect.', null, 'debug');
      return;
    }

    this.log(`[DOM Cleanup] Found ${scripts.length} <script> tags to inspect.`, null, 'debug');

    scripts.forEach((script, index) => {
      const scriptId = script.id ? `#${script.id}` : '';
      const scriptType = script.type ? `[type="${script.type}"]` : '';
      const selectorForLog = `script${scriptId}${scriptType}`;
      const contentPreview = (script.textContent || '').substring(0, 80).replace(/\n/g, ' ');

      // Condition 1: Remove <script type="text/html"> which are always templates.
      if (script.type === 'text/html') {
        this.log(`[DOM Cleanup] Removing template script ${index + 1}/${scripts.length}: ${selectorForLog}`, null, 'debug');
        script.remove();
        removedCount++;
        return; // Continue to next script
      }

      // Condition 2: Remove scripts containing template code or specific JS patterns.
      if (this.containsTemplateCode(script.textContent)) {
        this.log(`[DOM Cleanup] Removing script ${index + 1}/${scripts.length} with template content: ${selectorForLog}. Preview: "${contentPreview}..."`, null, 'debug');
        script.remove();
        removedCount++;
      }
    });

    this.log(`[DOM Cleanup] Finished. Removed ${removedCount} of ${scripts.length} script tags.`, null, 'debug');
  }

  /**
   * A regex-based fallback to clean any template scripts missed by the DOM parser.
   * Operates on the HTML string.
   */
  removeTemplateContent(html) {
    this.log('[Regex Cleanup] Starting regex-based cleanup as a fallback.', null, 'debug');
    if (!html || typeof html !== 'string') {
      this.log('[Regex Cleanup] Input is not a string, skipping.', null, 'warn');
      return html || '';
    }
    const initialLength = html.length;

    // This regex is a fallback to catch scripts that might have been missed by the DOM parser.
    // It looks for <script type="text/html"> or scripts containing common template patterns.
        const templateScriptRegex = /<script[^>]*type=[\"']text\/html[\"'][^>]*>[\s\S]*?<\/script>|<script[^>]*>[\s\S]*?(setupWebViewJavascriptBridge|WVJBCallbacks|<%|%>)<\/script>/gi;
    
    const cleanedHtml = html.replace(templateScriptRegex, '');
    const removedChars = initialLength - cleanedHtml.length;

    if (removedChars > 0) {
      this.log(`[Regex Cleanup] Removed ${removedChars} characters.`, null, 'debug');
    } else {
      this.log('[Regex Cleanup] No template content found to remove via regex.', null, 'debug');
    }
    
    return cleanedHtml;
  }

  /**
   * Gets all text nodes within a given element.
   */
  getAllTextNodes(element) {
    const textNodes = [];
    this.recursiveTextNodeSearch(element, textNodes);
    return textNodes;
  }
  
  /**
   * Recursively searches for text nodes.
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
   * Removes elements that are empty or contain only whitespace.
   */
  removeEmptyElements(tempDiv) {
    // Multiple passes to handle nested empty elements.
    for (let i = 0; i < 3; i++) {
      const emptyElements = tempDiv.querySelectorAll('*:not(img):not(input):not(textarea):not(select)');
      let removed = false;
      
      emptyElements.forEach(el => {
        // Check if element has no children and no meaningful text content.
        if (el.children.length === 0 && (el.textContent?.trim() || '') === '') {
          el.remove();
          removed = true;
        }
      });
      
      if (!removed) break; // If no elements were removed, the job is done.
    }
  }

  /**
   * Checks if a string contains template code or suspicious JavaScript patterns.
   */
  containsTemplateCode(text) {
    if (!text || typeof text !== 'string' || text.length < 10) return false;
    
    // Simplified but effective template detection.
    const hasTemplateDelimiters = /<%|%>|\{\{|\}\}/.test(text);
    const hasSuspiciousJS = /setupWebViewJavascriptBridge|WVJBCallbacks|bridge\.callHandler/.test(text);
    
    const result = hasTemplateDelimiters || hasSuspiciousJS;
    
    if (result && this.options?.debug) {
      this.log(`[Template Check] Detected template code. Delimiters: ${hasTemplateDelimiters}, Suspicious JS: ${hasSuspiciousJS}.`, null, 'debug');
      this.log(`[Template Check] Content preview: "${text.substring(0, 150).replace(/\n/g, '\\n')}"`, null, 'debug');
    }
    
    return result;
  }
}