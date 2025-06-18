/**
 * CLI适配器
 * 桥接共享核心模块与CLI环境的特定需求
 */

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';
import fsAsync from 'fs/promises';
import { createArticlePipeline } from '../../../shared/core/index.js';
import path from 'path';
import { JSDOM, VirtualConsole } from 'jsdom';

export class CLIAdapter {
  constructor(options = {}) {
    this.logFilePath = '/Users/chris/workspace/WechatArticle2Strapi/debug.log';
    try {
      // Clear or create the log file at the start of each run
      if (fs.existsSync(this.logFilePath)) {
        fs.unlinkSync(this.logFilePath);
      }
      fs.writeFileSync(this.logFilePath, `Log started at ${new Date().toISOString()}\n`);
    } catch (err) {
      console.error('Failed to initialize log file:', err);
    }

    this.options = {
      verbose: false,
      debug: false,
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      environment: 'node', // 默认为node环境，子类可以覆盖
      output: 'output', // Default output directory
      ...options
    };

    // 创建处理管道
    this.pipeline = createArticlePipeline({
      environment: this.options.environment, // 使用实际的环境设置
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
    
    if (this.options.debug) {
      virtualConsole.on('error', (error) => {
        this.log(`JSDOM错误: ${error.message}`, null, 'debug');
      });
      virtualConsole.on('warn', (warning) => {
        this.log(`JSDOM警告: ${warning}`, null, 'debug');
      });
    } else {
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
    if (!window.PerformanceObserver) {
      window.PerformanceObserver = function() {};
      window.PerformanceObserver.supportedEntryTypes = [];
    }
    if (!window.matchMedia) {
      window.matchMedia = function(query) {
        return {
          matches: false, media: query, onchange: null,
          addListener: function() {}, removeListener: function() {},
          addEventListener: function() {}, removeEventListener: function() {},
          dispatchEvent: function() {}
        };
      };
    }
    if (!window.IntersectionObserver) {
      window.IntersectionObserver = function() {};
      window.IntersectionObserver.prototype = { observe: function() {}, unobserve: function() {}, disconnect: function() {} };
    }
    if (!window.ResizeObserver) {
      window.ResizeObserver = function() {};
      window.ResizeObserver.prototype = { observe: function() {}, unobserve: function() {}, disconnect: function() {} };
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback) { return setTimeout(callback, 16); };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) { clearTimeout(id); };
    }
    if (!window.getComputedStyle) {
      window.getComputedStyle = function(element, _pseudoElement) {
        const style = element.style;
        return {
          getPropertyValue: function(prop) { return style[prop]; },
          setProperty: function(prop, value) { style[prop] = value; },
          removeProperty: function(prop) { delete style[prop]; },
          item: function(index) { return Object.keys(style)[index]; },
          length: Object.keys(style).length
        };
      };
    }
    if (!window.document.createTreeWalker) {
      window.document.createTreeWalker = function(root, whatToShow, filter, _entityReferenceExpansion) {
        let currentNode = root;
        return {
          root: root, whatToShow: whatToShow, filter: filter, currentNode: currentNode,
          nextNode: function() {
            function traverse(node) {
              if (node.firstChild) return node.firstChild;
              while (node) {
                if (node.nextSibling) return node.nextSibling;
                node = node.parentNode;
                if (node === root) return null;
              }
              return null;
            }
            currentNode = traverse(currentNode);
            if (whatToShow !== 0xFFFFFFFF && currentNode) {
                const nodeTypeMap = { 1: 0x1, 3: 0x4, 8: 0x80 };
                if (!(nodeTypeMap[currentNode.nodeType] & whatToShow)) return this.nextNode();
            }
            if (filter && currentNode && filter.acceptNode(currentNode) !== 1) return this.nextNode();
            return currentNode;
          }
        };
      };
    }
    if (!window.HTMLElement.prototype.hasOwnProperty('inert')) {
      Object.defineProperty(window.HTMLElement.prototype, 'inert', {
        get: function() { return this.hasAttribute('inert'); },
        set: function(value) { if (value) { this.setAttribute('inert', ''); } else { this.removeAttribute('inert'); } }
      });
    }
  }

  /**
   * 获取HTML内容
   * @param {string} url - URL
   * @returns {Promise<string>} HTML内容
   */
  async fetchHtmlContent(url) {
    this.log(`获取HTML内容: ${url}`);
    try {
      const response = await axios.get(url, {
        timeout: this.options.timeout,
        headers: { 'User-Agent': this.options.userAgent }
      });
      return response.data;
    } catch (error) {
      this.log(`获取HTML失败: ${error.message}`, null, 'error');
      throw error;
    }
  }

  /**
   * 等待页面加载完成
   * @param {Window} window - JSDOM window对象
   * @returns {Promise<void>}
   */
  async waitForPageLoad(window) {
    return new Promise((resolve) => {
      if (window.document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve(), { once: true });
        setTimeout(() => {
          this.log('页面加载超时', null, 'warn');
          resolve(); 
        }, this.options.timeout / 2);
      }
    });
  }

  /**
   * CLI特定的文章增强处理
   * @param {Object} article - 文章数据
   * @param {Window} window - JSDOM window对象
   * @returns {Promise<Object>} 增强后的文章数据
   */
  async enhanceArticleForCLI(article, window) {
    const articleUrl = window.location.href;
    console.log('>>> enhanceArticleForCLI this.options.debug:', this.options.debug);
    this.log('执行CLI特定增强处理');
    if (article.images && article.images.length > 0) {
      this.log(`增强处理 ${article.images.length} 张图片`, null, 'debug');
      const imageProcessingResult = await this.processImagesForCLI(article.images, article.content, articleUrl);
      article.images = imageProcessingResult.processedImages;
      article.content = imageProcessingResult.updatedContent;
    }
    article.extractionEnvironment = 'cli';
    article.nodeVersion = process.version;
    article.extractedBy = 'wechat-article-extractor-cli';
    article.stats = {
      processingTime: Date.now() - (article.timestamp || Date.now()),
      wordCount: this.calculateWordCount(article.content),
      readingTime: this.calculateReadingTime(article.content)
    };
    return article;
  }

  /**
   * CLI环境下的图片处理: 下载图片, 更新本地路径, 并修改HTML内容。
   * @param {Array} images - 图片对象数组 from extractor
   * @param {string} htmlContent - HTML content of the article. Note: This was previously articleContent, changed to htmlContent for clarity.
   * @returns {Promise<Object>} Object containing processedImages and updatedContent
   */
  async processImagesForCLI(images, htmlContent, articleUrl) { // Note: parameter changed from articleContent to htmlContent
    this.loggedDomBodyThisCall = false; // Initialize flag for this call
  this.loggedAllImageSourcesInDOMThisCall = false; // Initialize flag for this call
  console.log('>>> processImagesForCLI entered. this.options.debug:', this.options.debug); // DIAGNOSTIC
    // Log the structure of the first couple of image objects to check for downloadedPath
    if (images && images.length > 0) {
      this.log('>>> processImagesForCLI: Received images (sample):', { imagesSample: JSON.stringify(images.slice(0, 2), null, 2) }, 'debug');
    } else {
      this.log('>>> processImagesForCLI: Received no images or empty images array.', null, 'debug');
    }
    this.log(`Starting CLI image processing for ${images.length} images.`, null, 'debug');
    const outputBaseDir = path.resolve(process.cwd(), this.options.output || 'output'); // Use output option
    const imagesDir = path.join(outputBaseDir, 'images');
    const relativeImagesDir = 'images'; // Used for paths in HTML

    try {
      this.log(`Attempting to create images directory: ${imagesDir}`, null, 'debug');
      await fsAsync.mkdir(imagesDir, { recursive: true });
      this.log(`Successfully created or ensured images directory exists: ${imagesDir}`, null, 'debug');
    } catch (error) {
      const criticalErrorMsg = `CRITICAL: Failed to create image directory ${imagesDir}: ${error.message}`;
      this.log(criticalErrorMsg, null, 'error');
      // It's crucial to re-throw or handle this error appropriately.
      // For now, we'll let it propagate, as image saving is critical.
      throw new Error(criticalErrorMsg);
    }

    const processedImages = [];
    // urlToLocalPathMap maps the *original URL found in the HTML* to the *new local relative path*.
    const urlToLocalPathMap = new Map();

    for (const image of images) {
      // image.src is the original URL from the extractor, which should match what's in the HTML.
      // image.downloadedPath is the path *if already downloaded by a previous step* (e.g. by Playwright's own image loading).
      // We prioritize image.downloadedPath if available and valid.
      // Otherwise, we download from image.src.

      let originalUrlInHtml = image.src; // This is the key for the map and for searching in HTML
      let sourceForDownload = image.src; // This is the URL we'll actually try to download from
      let localRelativePath = null;
      let downloadedThisTurn = false;
      let processingError = null;
      let finalLocalAbsPath = null; // Absolute path where the image is/will be stored

      this.log(`Processing image. Original src: ${originalUrlInHtml}`, { imageDetails: image }, 'debug');

      try {
        if (!sourceForDownload) {
          throw new Error('Image src is null or empty, cannot download.');
        }

        // Normalize URL for download if necessary (e.g., //example.com/img.jpg -> https://example.com/img.jpg)
        if (sourceForDownload.startsWith('//')) {
          sourceForDownload = 'https:' + sourceForDownload;
          this.log(`Normalized // URL to ${sourceForDownload}`, null, 'debug');
        }
        
        if (!(sourceForDownload.startsWith('http:') || sourceForDownload.startsWith('https:'))) {
          // If it's a data URI or other non-downloadable format, we might handle it differently or skip.
          // For now, we assume we only download http/https URLs.
          // If image.downloadedPath exists, we might still be able to use it.
          if (image.downloadedPath && await fs.access(image.downloadedPath).then(() => true).catch(() => false)) {
             this.log(`Source URL ${sourceForDownload} is not http/https. Using pre-downloaded path: ${image.downloadedPath}`, null, 'debug');
          } else {
            throw new Error(`Invalid image URL scheme for download: ${sourceForDownload}. Not http/https and no valid downloadedPath.`);
          }
        }

        // Determine filename
        const urlForFilename = new URL(sourceForDownload.startsWith('http') ? sourceForDownload : `http://dummy.com/${path.basename(originalUrlInHtml)}`);
        let imageName = path.basename(urlForFilename.pathname);
        const ext = path.extname(imageName);

        if (!imageName || imageName === '/' || imageName.length > 100 || !ext) {
            const defaultExt = image.mimeType ? `.${image.mimeType.split('/')[1]}` : '.png';
            imageName = `image_${Date.now()}${ext || defaultExt}`.substring(0,100);
            this.log(`Generated new image name: ${imageName} due to invalid original name or extension.`, null, 'debug');
        }
        // Sanitize and make unique
        const safeImageName = `${Date.now()}_${imageName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        finalLocalAbsPath = path.join(imagesDir, safeImageName);

        // Check if already downloaded (e.g., by Playwright if loadImages was true, or if it's a data URI that was saved)
        if (image.downloadedPath && await fs.access(image.downloadedPath).then(() => true).catch(() => false)) {
            this.log(`Image ${originalUrlInHtml} already downloaded to ${image.downloadedPath}. Copying to ${finalLocalAbsPath}`, null, 'debug');
            await fs.copyFile(image.downloadedPath, finalLocalAbsPath);
            // No need to set downloadedThisTurn = true, as it wasn't downloaded *by this method*.
        } else if (sourceForDownload.startsWith('http:') || sourceForDownload.startsWith('https:')) {
            this.log(`Downloading image ${sourceForDownload} to ${finalLocalAbsPath}`, null, 'debug');
            const response = await axios.get(sourceForDownload, {
              responseType: 'arraybuffer',
              timeout: this.options.timeout || 30000,
              headers: { 'User-Agent': this.options.userAgent || 'Mozilla/5.0' }
            });
            await fsAsync.writeFile(finalLocalAbsPath, response.data);
            downloadedThisTurn = true;
            this.log(`Successfully downloaded ${safeImageName} from ${sourceForDownload}`, null, 'debug');
        } else {
            throw new Error(`Cannot process image: ${originalUrlInHtml}. Not a downloadable URL and no pre-existing downloadedPath.`);
        }
        
        localRelativePath = path.join(relativeImagesDir, safeImageName).replace(/\\/g, '/'); // Ensure forward slashes for HTML
        urlToLocalPathMap.set(originalUrlInHtml, localRelativePath);
        this.log(`Mapped original URL "${originalUrlInHtml}" to local path "${localRelativePath}"`, null, 'debug');

        // If originalUrlInHtml is an absolute HTTP/HTTPS URL, also map its protocol-relative version
        // because the HTML content might use protocol-relative URLs (e.g., src="//domain.com/img.png")
        let protocolRelativeVersion = null;
        if (originalUrlInHtml.startsWith('https://')) {
            protocolRelativeVersion = originalUrlInHtml.substring('https:'.length); // e.g., "//domain.com/path"
        } else if (originalUrlInHtml.startsWith('http://')) {
            protocolRelativeVersion = originalUrlInHtml.substring('http:'.length); // e.g., "//domain.com/path"
        }

        if (protocolRelativeVersion && protocolRelativeVersion !== originalUrlInHtml && !urlToLocalPathMap.has(protocolRelativeVersion)) {
            urlToLocalPathMap.set(protocolRelativeVersion, localRelativePath);
            this.log(`Also mapped protocol-relative version "${protocolRelativeVersion}" to local path "${localRelativePath}"`, null, 'debug');
        }
        
        // Additionally, if the sourceForDownload URL (which might have been normalized for download, e.g. from // to https)
        // is different from originalUrlInHtml and not already in the map, add it too.
        // This covers cases where the HTML might, for some reason, contain the exact sourceForDownload URL if it was different.
        if (sourceForDownload !== originalUrlInHtml && !urlToLocalPathMap.has(sourceForDownload)) {
           urlToLocalPathMap.set(sourceForDownload, localRelativePath);
           this.log(`Also mapped (potentially normalized) download URL "${sourceForDownload}" to local path "${localRelativePath}"`, null, 'debug');
        }

      } catch (error) {
        this.log(`Image processing/download failed for ${originalUrlInHtml} (source: ${sourceForDownload}): ${error.message}`, { stack: error.stack }, 'warn');
        processingError = error.message;
        // Even if download fails, we keep the original image data in processedImages
      }

      processedImages.push({
        ...image, // Spread original image properties
        src: image.src, // Keep original src for reference
        originalSrc: image.src, // Explicitly store original src
        localPath: localRelativePath, // The new local relative path, or null if failed
        downloaded: !!localRelativePath && !processingError, // True if we have a local path and no error
        downloadedThisTurn: downloadedThisTurn, // Specifically if this method downloaded it
        validated: !processingError, // Considered valid if no processing error occurred
        error: processingError,
        processedAt: new Date().toISOString(),
        finalLocalAbsPath: finalLocalAbsPath // Store the absolute path for potential later use
      });
    }

    this.log(`Finished processing ${images.length} images. ${urlToLocalPathMap.size} images successfully mapped to local paths.`, null, 'debug');

    let updatedHtmlContent = htmlContent; // Use the passed-in htmlContent
    if (urlToLocalPathMap.size > 0 && htmlContent) {
      this.log(`Updating HTML content with ${urlToLocalPathMap.size} local image paths.`, null, 'info');
      this.log('Image URL to local path map:', urlToLocalPathMap, 'debug');
      this.log(`Attempting to update HTML content. ${urlToLocalPathMap.size} images mapped. HTML length: ${htmlContent.length}`, null, 'debug');
      if (this.options.debug && htmlContent) {
        this.log(`>>> processImagesForCLI: Raw htmlContent (first 2000 chars): ${htmlContent.substring(0, 2000)}`);
        const imgTagCountInRaw = (htmlContent.match(/<img/gi) || []).length;
        this.log(`>>> processImagesForCLI: Raw htmlContent contains ${imgTagCountInRaw} <img occurrences (regex match).`);
      } else if (this.options.debug) {
        this.log(`>>> processImagesForCLI: Raw htmlContent is null or empty.`);
      }
      try {
        const dom = new JSDOM(htmlContent, {
      url: articleUrl,
      resources: "usable",
      pretendToBeVisual: true,
      virtualConsole: this.createVirtualConsole()
    });
                const document = dom.window.document;
        this.log('JSDOM parsed body outerHTML:', document.body.outerHTML, 'debug');
        let replacementsMade = 0;
        // One-time debug log for JSDOM's parsed body for this call
        if (this.options.debug && !this.loggedDomBodyThisCall) {
            const bodyHtml = document.body ? document.body.outerHTML : 'document.body is null/undefined';
            // Log only the first 2000 characters to avoid overly long logs
            const logMessage = bodyHtml.substring(0, 2000) + (bodyHtml.length > 2000 ? '...' : '');
            this.log('>>> HTMLUpdate: JSDOM parsed document.body.outerHTML (first 2000 chars):', { bodyOuterHTML: logMessage }, 'debug');
            this.loggedDomBodyThisCall = true;
        }

        // One-time debug log for all image sources in the DOM for this call
        if (this.options.debug && !this.loggedAllImageSourcesInDOMThisCall) {
            const allImgElements = document.querySelectorAll('img');
            this.log(`>>> HTMLUpdate: Found ${allImgElements.length} <img> tags in JSDOM document (this call).`, null, 'debug');
            const sources = [];
            allImgElements.forEach(img => {
                const src = img.getAttribute('src');
                const dataSrc = img.getAttribute('data-src');
                if (src && src.trim() !== '') sources.push({ tag: 'img', attr: 'src', value: src });
                if (dataSrc && dataSrc.trim() !== '') sources.push({ tag: 'img', attr: 'data-src', value: dataSrc });
            });

            if (sources.length > 0) {
                 this.log('>>> HTMLUpdate: All non-empty img src/data-src attributes in DOM (this call, max 50 shown):', { allImageSourcesInHtml: JSON.stringify(sources.slice(0, 50)) }, 'debug');
            } else {
                 this.log('>>> HTMLUpdate: No non-empty img src/data-src attributes found in DOM (this call).', null, 'debug');
            }
            this.loggedAllImageSourcesInDOMThisCall = true;
        }

        const allImages = document.querySelectorAll('img');
        this.log(`Found ${allImages.length} total <img> tags in the document. Iterating to match against the map.`, null, 'debug');

        allImages.forEach(img => {
          const originalSrc = img.getAttribute('src');
          const originalDataSrc = img.getAttribute('data-src');

          if (originalSrc && urlToLocalPathMap.has(originalSrc)) {
            const localPath = urlToLocalPathMap.get(originalSrc);
            img.setAttribute('src', localPath);
            this.log(`Replaced src: "${originalSrc.substring(0, 100)}..." with "${localPath}"`, null, 'debug');
            replacementsMade++;
          }

          if (originalDataSrc && urlToLocalPathMap.has(originalDataSrc)) {
            const localPath = urlToLocalPathMap.get(originalDataSrc);
            img.setAttribute('data-src', localPath);
            // Also update src if it was the same as data-src, a common lazy-loading pattern
            if (originalSrc === originalDataSrc) {
              img.setAttribute('src', localPath);
            }
            this.log(`Replaced data-src: "${originalDataSrc.substring(0, 100)}..." with "${localPath}"`, null, 'debug');
            replacementsMade++;
          }
        });

        if (replacementsMade > 0) {
          updatedHtmlContent = dom.serialize();
          this.log(`HTML content update process completed. Made ${replacementsMade} replacements. Serialized updated DOM. New length: ${updatedHtmlContent.length}`, null, 'debug');
        } else {
          this.log('HTML content update: No matching img src/data-src attributes found for mapped images.', null, 'debug');
        }
      } catch (htmlUpdateError) {
        this.log(`Error updating HTML content with local image paths: ${htmlUpdateError.message}`, { stack: htmlUpdateError.stack }, 'error');
        // Decide if we should return original htmlContent or throw. For now, return original.
      }
    } else {
      if (urlToLocalPathMap.size === 0) {
        this.log('No images successfully mapped to local paths; HTML content will not be updated.', null, 'debug');
      }
      if (!htmlContent) {
        this.log('HTML content is empty; cannot update.', null, 'debug');
      }
    }
    
    const successfullyDownloadedCount = processedImages.filter(img => img.downloaded).length;
    this.log(`Image processing in processImagesForCLI complete. ${successfullyDownloadedCount} images marked as downloaded.`, null, 'info');
    return { processedImages, updatedContent: updatedHtmlContent };
  }

  /**
   * 计算字数
   * @param {string} content - 内容
   * @returns {number} 字数
   */
  calculateWordCount(content) {
    if (!content) return 0;
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const chineseChars = (textContent.match(/[一-鿿]/g) || []).length;
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
   * 输出详细的提取报告
   * @param {Object} result - 提取结果
   */
  printExtractionReport(result) {
    const { article, strapi } = result;
    console.log(chalk.blue('\n📊 提取报告'));
    console.log('='.repeat(50));
    console.log(chalk.green('✅ 基础信息:'));
    console.log(`  标题: ${article.title || '未获取'}`);
    console.log(`  作者: ${article.author || '未获取'}`);
    console.log(`  发布时间: ${article.publishTime || '未获取'}`);
    console.log(`  URL: ${article.url}`);
    console.log(chalk.green('\n📝 内容统计:'));
    console.log(`  内容长度: ${article.content?.length || 0} 字符`);
    console.log(`  字数统计: ${article.stats?.wordCount || 0} 字`);
    console.log(`  预计阅读: ${article.stats?.readingTime || 0} 分钟`);
    console.log(`  图片数量: ${article.images?.length || 0} 张`);
    console.log(chalk.green('\n🔧 提取信息:'));
    console.log(`  提取方法: ${article.extractionMethod}`);
    console.log(`  提取环境: ${article.extractionEnvironment}`);
    console.log(`  处理时间: ${article.stats?.processingTime || 0} ms`);
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
    const isoTimestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [CLIAdapter]`;
    const filePrefix = `[${isoTimestamp}] [CLIAdapter]`; // Use ISO for file logs for better sorting

    // File logging
    try {
      let fileMessage = `${filePrefix} [${level.toUpperCase()}] ${message}`;
      if (data) {
        // Stringify data carefully, handling circular references and depth
        const dataString = JSON.stringify(data, (key, value) => {
          if (value instanceof Error) {
            return { message: value.message, stack: value.stack };
          }
          return value;
        }, 2); // Indent for readability
        fileMessage += ` ${dataString}`;
      }
      fs.appendFileSync(this.logFilePath, fileMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }

    switch (level) {
      case 'error': console.error(chalk.red(`${prefix} ❌ ${message}`), data || ''); break;
      case 'warn': console.error(chalk.yellow(`${prefix} ⚠️  ${message}`), data || ''); break;
      case 'debug': console.error(chalk.gray(`${prefix} 🔍 ${message}`), data || ''); break;
      default: console.error(chalk.blue(`${prefix} ${message}`), data || '');
    }
  }
}