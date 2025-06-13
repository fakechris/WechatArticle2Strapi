/**
 * CLI适配器
 * 桥接共享核心模块与CLI环境的特定需求
 */

import { JSDOM, VirtualConsole } from 'jsdom';
import axios from 'axios';
import chalk from 'chalk';
import { createArticlePipeline } from '../../../shared/core/index.js';

export class CLIAdapter {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      debug: false,
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      environment: 'node',
      ...options
    };

    // 创建处理管道
    this.pipeline = createArticlePipeline({
      environment: 'node',
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

    this.log('CLI适配器初始化完成');
  }

  /**
   * 从URL提取文章
   * @param {string} url - 文章URL
   * @returns {Promise<Object>} 提取结果
   */
  async extractFromUrl(url) {
    this.log(`开始提取文章: ${url}`);

    try {
      // 获取HTML内容
      const htmlContent = await this.fetchHtmlContent(url);
      
      // 解析为DOM - 优化配置以避免JS执行错误
      const dom = new JSDOM(htmlContent, { 
        url: url,
        resources: 'usable',
        runScripts: 'outside-only', // 改为outside-only，避免执行页面内部脚本
        pretendToBeVisual: true,
        virtualConsole: this.createVirtualConsole() // 添加虚拟控制台处理错误
      });

      // 添加缺失的浏览器API以防止错误
      this.polyfillBrowserAPIs(dom.window);

      // 不需要等待页面加载，因为我们不执行JS
      // await this.waitForPageLoad(dom.window);

      // 使用共享核心逻辑提取
      const result = await this.pipeline.process(dom.window.document, url);

      // CLI特定的增强处理
      result.article = await this.enhanceArticleForCLI(result.article, dom.window);

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
   * 创建虚拟控制台以处理JSDOM错误
   * @returns {VirtualConsole} 虚拟控制台
   */
  createVirtualConsole() {
    const virtualConsole = new VirtualConsole();
    
    // 只在debug模式下显示错误，否则静默处理
    if (this.options.debug) {
      virtualConsole.on('error', (error) => {
        this.log(`JSDOM错误: ${error.message}`, null, 'debug');
      });
      
      virtualConsole.on('warn', (warning) => {
        this.log(`JSDOM警告: ${warning}`, null, 'debug');
      });
    } else {
      // 静默处理错误和警告
      virtualConsole.on('error', () => {});
      virtualConsole.on('warn', () => {});
      virtualConsole.on('jsdomError', () => {});
    }

    return virtualConsole;
  }

  /**
   * 为JSDOM window添加缺失的浏览器API
   * @param {Window} window - JSDOM window对象
   */
  polyfillBrowserAPIs(window) {
    // 添加 PerformanceObserver
    if (!window.PerformanceObserver) {
      window.PerformanceObserver = function() {};
      window.PerformanceObserver.supportedEntryTypes = [];
    }

    // 添加 matchMedia
    if (!window.matchMedia) {
      window.matchMedia = function(query) {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: function() {},
          removeListener: function() {},
          addEventListener: function() {},
          removeEventListener: function() {},
          dispatchEvent: function() {}
        };
      };
    }

    // 添加 IntersectionObserver
    if (!window.IntersectionObserver) {
      window.IntersectionObserver = function() {};
      window.IntersectionObserver.prototype.observe = function() {};
      window.IntersectionObserver.prototype.unobserve = function() {};
      window.IntersectionObserver.prototype.disconnect = function() {};
    }

    // 添加 ResizeObserver
    if (!window.ResizeObserver) {
      window.ResizeObserver = function() {};
      window.ResizeObserver.prototype.observe = function() {};
      window.ResizeObserver.prototype.unobserve = function() {};
      window.ResizeObserver.prototype.disconnect = function() {};
    }

    // 添加 requestAnimationFrame
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback) {
        return setTimeout(callback, 16);
      };
    }

    // 添加 cancelAnimationFrame
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
    }

    // 添加 getComputedStyle 的增强
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(element, pseudoElement) {
      try {
        return originalGetComputedStyle.call(this, element, pseudoElement);
      } catch (error) {
        // 返回空的样式对象
        return {
          getPropertyValue: () => '',
          setProperty: () => {},
          removeProperty: () => {},
          item: () => '',
          length: 0
        };
      }
    };

    if (this.options.debug) {
      this.log('已添加浏览器API polyfills', null, 'debug');
    }
  }

  /**
   * 获取HTML内容
   * @param {string} url - URL
   * @returns {Promise<string>} HTML内容
   */
  async fetchHtmlContent(url) {
    this.log('获取HTML内容...');

    try {
      const response = await axios.get(url, {
        timeout: this.options.timeout,
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Cache-Control': 'max-age=0',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"'
        },
        responseType: 'text',
        maxRedirects: 5
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.log(`HTML内容获取成功 (${response.data.length} 字符)`);
      return response.data;

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(`请求超时 (${this.options.timeout}ms)`);
      } else if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('网络连接失败，请检查网络或URL是否正确');
      } else {
        throw new Error(`请求失败: ${error.message}`);
      }
    }
  }

  /**
   * 等待页面加载完成
   * @param {Window} window - JSDOM window对象
   * @returns {Promise<void>}
   */
  async waitForPageLoad(window) {
    return new Promise((resolve) => {
      // 简单的等待策略：等待短暂时间让JS执行
      setTimeout(() => {
        // 可以在这里添加更复杂的加载检测逻辑
        resolve();
      }, 1000);
    });
  }

  /**
   * CLI特定的文章增强处理
   * @param {Object} article - 文章数据
   * @param {Window} window - JSDOM window对象
   * @returns {Promise<Object>} 增强后的文章数据
   */
  async enhanceArticleForCLI(article, window) {
    this.log('执行CLI特定增强处理');

    // 增强图片处理
    if (article.images && article.images.length > 0) {
      // 在CLI环境中，我们可能需要下载和处理图片
      article.images = await this.processImagesForCLI(article.images);
    }

    // 增强元数据
    article.extractionEnvironment = 'cli';
    article.nodeVersion = process.version;
    article.extractedBy = 'wechat-article-extractor-cli';

    // 添加统计信息
    article.stats = {
      processingTime: Date.now() - (article.timestamp || Date.now()),
      wordCount: this.calculateWordCount(article.content),
      readingTime: this.calculateReadingTime(article.content)
    };

    return article;
  }

  /**
   * CLI环境下的图片处理
   * @param {Array} images - 图片数组
   * @returns {Promise<Array>} 处理后的图片数组
   */
  async processImagesForCLI(images) {
    this.log(`处理 ${images.length} 张图片`);

    // 在CLI环境中，我们可以：
    // 1. 验证图片URL的有效性
    // 2. 下载图片并计算尺寸
    // 3. 压缩图片
    // 4. 生成缩略图
    // 目前简化处理，只验证URL

    const processedImages = [];
    
    for (const image of images) {
      try {
        // 简单的URL验证
        if (image.src && image.src.startsWith('http')) {
          processedImages.push({
            ...image,
            validated: true,
            processedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        this.log(`图片处理失败: ${image.src}`, error.message, 'warn');
      }
    }

    this.log(`图片处理完成，有效图片 ${processedImages.length} 张`);
    return processedImages;
  }

  /**
   * 计算字数
   * @param {string} content - 内容
   * @returns {number} 字数
   */
  calculateWordCount(content) {
    if (!content) return 0;
    
    // 移除HTML标签，计算纯文本字数
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    
    // 中文字符计数
    const chineseChars = (textContent.match(/[\u4e00-\u9fff]/g) || []).length;
    
    // 英文单词计数
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
    // 假设平均阅读速度：中文500字/分钟，英文200词/分钟
    const avgReadingSpeed = 400; // 综合平均值
    return Math.max(1, Math.round(wordCount / avgReadingSpeed));
  }

  /**
   * 输出详细的提取报告
   * @param {Object} result - 提取结果
   */
  printExtractionReport(result) {
    const { article, strapi } = result;
    
    console.log(chalk.blue('\n📊 提取报告'));
    console.log('='.repeat(50));
    
    // 基础信息
    console.log(chalk.green('✅ 基础信息:'));
    console.log(`  标题: ${article.title || '未获取'}`);
    console.log(`  作者: ${article.author || '未获取'}`);
    console.log(`  发布时间: ${article.publishTime || '未获取'}`);
    console.log(`  URL: ${article.url}`);
    
    // 内容统计
    console.log(chalk.green('\n📝 内容统计:'));
    console.log(`  内容长度: ${article.content?.length || 0} 字符`);
    console.log(`  字数统计: ${article.stats?.wordCount || 0} 字`);
    console.log(`  预计阅读: ${article.stats?.readingTime || 0} 分钟`);
    console.log(`  图片数量: ${article.images?.length || 0} 张`);
    
    // 提取信息
    console.log(chalk.green('\n🔧 提取信息:'));
    console.log(`  提取方法: ${article.extractionMethod}`);
    console.log(`  提取环境: ${article.extractionEnvironment}`);
    console.log(`  处理时间: ${article.stats?.processingTime || 0} ms`);
    
    // Strapi状态
    if (strapi) {
      console.log(chalk.green('\n🚀 Strapi状态:'));
      if (strapi.success) {
        console.log(chalk.green(`  ✅ 发送成功 (ID: ${strapi.id})`));
      } else {
        console.log(chalk.red(`  ❌ 发送失败: ${strapi.error}`));
      }
    }
    
    console.log('\n' + '='.repeat(50));
  }

  /**
   * 调试日志
   */
  log(message, data = null, level = 'info') {
    if (!this.options.verbose && level === 'info') return;
    if (!this.options.debug && level === 'debug') return;

    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [CLIAdapter]`;

    switch (level) {
      case 'error':
        console.error(chalk.red(`${prefix} ❌ ${message}`), data || '');
        break;
      case 'warn':
        console.warn(chalk.yellow(`${prefix} ⚠️  ${message}`), data || '');
        break;
      case 'debug':
        console.log(chalk.gray(`${prefix} 🔍 ${message}`), data || '');
        break;
      default:
        console.log(chalk.blue(`${prefix} ${message}`), data || '');
    }
  }
} 