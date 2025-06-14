import axios from 'axios';
import { JSDOM } from 'jsdom';
import Defuddle from 'defuddle';
import slug from 'slug';
import ora from 'ora';
import chalk from 'chalk';
import MetadataExtractor from './metadata.js';
import ImageProcessor from './images.js';
import CleanupRules from './cleanup-rules.js';
import StrapiIntegration from './strapi.js';

class ArticleExtractor {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      processImages: false,
      maxImages: 10,
      imageQuality: 0.8,
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options
    };
    
    this.metadataExtractor = new MetadataExtractor();
    this.imageProcessor = new ImageProcessor(this.options);
    this.cleanupRules = new CleanupRules();
    
    // Initialize Strapi integration if config is provided
    if (this.options.config && this.options.config.strapiUrl) {
      this.strapiIntegration = new StrapiIntegration(this.options.config, {
        verbose: this.options.verbose
      });
    }
  }

  async extract(urlOrPath) {
    let spinner;
    try {
      spinner = ora('Starting extraction...').start();
    } catch (oraError) {
      // Fallback if ora fails
      console.log('🚀 Starting extraction...');
      spinner = {
        text: '',
        start: Date.now(),
        succeed: (msg) => console.log('✅', msg),
        fail: (msg) => console.log('❌', msg)
      };
    }
    
    try {
      // Check if it's a local file or URL
      let isLocalFile = false;
      let url = urlOrPath;
      
      try {
        const urlObj = new URL(urlOrPath);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
        }
      } catch (urlError) {
        // Check if it's a local file path
        const fs = await import('fs-extra');
        if (await fs.default.pathExists(urlOrPath)) {
          isLocalFile = true;
          url = urlOrPath;
          spinner.text = 'Reading local file...';
        } else {
          throw new Error(`Invalid URL format and file does not exist: ${urlOrPath}`);
        }
      }

      if (this.options.verbose) {
        spinner.text = `Fetching: ${url}`;
      }

      // Get HTML content
      let htmlContent;
      
      if (isLocalFile) {
        const fs = await import('fs-extra');
        htmlContent = await fs.default.readFile(url, 'utf8');
        url = `file://${url}`; // Convert to file URL for JSDOM
      } else {
        // Fetch webpage
        const axiosConfig = {
          timeout: this.options.timeout,
          headers: {
            'User-Agent': this.options.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
          decompress: true,
          responseType: 'text'
        };

        // Special handling for WeChat URLs
        if (url.includes('mp.weixin.qq.com')) {
          axiosConfig.headers['Referer'] = 'https://mp.weixin.qq.com/';
          // Don't set Host header manually - let axios handle it
        }

        if (this.options.verbose) {
          console.log('Making HTTP request with config:', JSON.stringify(axiosConfig, null, 2));
        }

        const response = await axios.get(url, axiosConfig);
        htmlContent = response.data;
      }

      spinner.text = 'Parsing HTML...';

      // Parse HTML with JSDOM
      const dom = new JSDOM(htmlContent, {
        url: url,
        referrer: url,
        contentType: 'text/html',
        includeNodeLocations: false,
        pretendToBeVisual: true,
        resources: 'usable'
      });

      const document = dom.window.document;
      const window = dom.window;

      // Apply cleanup rules before extraction
      spinner.text = 'Applying cleanup rules...';
      const removedElements = this.cleanupRules.apply(document, url);
      
      if (this.options.verbose && removedElements > 0) {
        console.log(chalk.gray(`\n🧹 Removed ${removedElements} noise elements`));
      }

      // Determine extraction method based on URL
      const urlObj = new URL(url);
      const isWeChatArticle = urlObj.hostname === 'mp.weixin.qq.com';
      
      spinner.text = isWeChatArticle ? 'Extracting WeChat article...' : 'Extracting content...';

      let article;
      if (isWeChatArticle) {
        article = await this.extractWeChatArticle(document, window, url);
      } else {
        article = await this.extractGeneralContent(document, window, url);
      }

      // Extract enhanced metadata
      spinner.text = 'Extracting metadata...';
      const metadata = this.metadataExtractor.extract(document, window, url);
      
      // Merge metadata with article
      article = this.mergeMetadata(article, metadata);

      // Process images if enabled
      if (this.options.processImages && article.images && article.images.length > 0) {
        spinner.text = 'Processing images...';
        article = await this.imageProcessor.process(article, url);
      }

      // Process head image if Strapi integration is enabled and head image upload is configured
      if (this.strapiIntegration && this.options.config.advancedSettings?.uploadHeadImg) {
        spinner.text = 'Processing head image...';
        article = await this.processHeadImage(article);
      }

      // Process and upload images to Strapi if enabled
      if (this.strapiIntegration && this.options.config.advancedSettings?.uploadImages && article.images && article.images.length > 0) {
        spinner.text = 'Uploading images to Strapi...';
        article = await this.processArticleImages(article);
      }

      // Add extraction stats
      article.extractionStats = {
        url: url,
        extractedAt: new Date().toISOString(),
        removedElements: removedElements,
        responseSize: htmlContent.length,
        parseTime: Date.now() - spinner.start
      };

      spinner.succeed('Article extracted successfully!');
      
      if (this.options.verbose) {
        this.logExtractionSummary(article);
      }

      return article;

    } catch (error) {
      spinner.fail('Extraction failed');
      
      // Provide user-friendly error messages
      let userMessage = error.message;
      
      if (error.message.includes('Client network socket disconnected')) {
        userMessage = 'Network connection failed. This may be due to:\n' +
                     '  • Network connectivity issues\n' +
                     '  • Website blocking automated requests\n' +
                     '  • Firewall or proxy restrictions\n' +
                     '  • TLS/SSL configuration problems\n\n' +
                     'Try again later or use a different network.';
      } else if (error.message.includes('protocol mismatch')) {
        userMessage = 'HTTP protocol configuration error. This is usually a temporary issue.\n' +
                     'Please try again in a moment.';
      } else if (error.message.includes('timeout')) {
        userMessage = 'Request timed out. The website may be slow or unresponsive.';
      } else if (error.message.includes('ENOTFOUND')) {
        userMessage = 'Domain not found. Please check the URL is correct.';
      } else if (error.message.includes('ECONNREFUSED')) {
        userMessage = 'Connection refused. The server may be down or blocking requests.';
      }
      
      if (this.options.verbose) {
        console.error('\n🔍 Debug info:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Throw a more user-friendly error
      const friendlyError = new Error(userMessage);
      friendlyError.originalError = error;
      throw friendlyError;
    }
  }

  async extractWeChatArticle(document, window, url) {
    if (this.options.verbose) {
      console.log(chalk.blue('\n📱 Using WeChat-specific extraction'));
    }

    // Try WeChat-specific selectors first for better accuracy
    const wechatResult = this.extractWithWeChatSelectors(document, url);
    
    // If WeChat selectors got good content, use it
    if (wechatResult.content && wechatResult.content.length > 500) {
      if (this.options.verbose) {
        console.log(chalk.green('✨ Using WeChat selectors - found substantial content'));
      }
      return wechatResult;
    }

    // Fallback to Defuddle if WeChat selectors didn't work well
    try {
      if (this.options.verbose) {
        console.log('WeChat selectors insufficient, trying Defuddle...');
      }
      
      const defuddle = new Defuddle(document, {
        debug: this.options.verbose,
        removeExactSelectors: false,  // 降低清理强度，避免误删正文
        removePartialSelectors: false, // 降低清理强度
        // WeChat-specific options
        contentSelector: '#js_content, .rich_media_content, .rich_media_area_primary, .weui-article, .weui-msg',
        titleSelector: '#activity-name, .rich_media_title, h1',
        authorSelector: '#js_name, .rich_media_meta_text'
      });

      const defuddleResult = defuddle.parse();

      if (defuddleResult && defuddleResult.content && defuddleResult.content.length > 100) {
        if (this.options.verbose) {
          console.log(chalk.green('✨ Using Defuddle result for WeChat'));
          console.log(`Content length: ${defuddleResult.content.length} chars`);
        }
        return this.enhanceWithWeChatMetadata(defuddleResult, document, url);
      } else {
        if (this.options.verbose) {
          console.log(chalk.yellow('⚠️ Defuddle result insufficient'));
          if (defuddleResult) {
            console.log(`Defuddle content length: ${defuddleResult.content ? defuddleResult.content.length : 'null'}`);
          }
        }
      }
    } catch (error) {
      if (this.options.verbose) {
        console.log(chalk.yellow(`⚠️ Defuddle failed: ${error.message}`));
      }
    }

    // Return WeChat selectors result as final fallback
    if (this.options.verbose) {
      console.log(chalk.blue('Using WeChat selectors as fallback'));
    }
    return wechatResult;
  }

  extractWithWeChatSelectors(document, url) {
    // WeChat title extraction - try multiple selectors
    const titleEl = document.querySelector('#activity-name') || 
                    document.querySelector('.rich_media_title') ||
                    document.querySelector('h1[data-role="title"]') ||
                    document.querySelector('h1');

    // WeChat author extraction - get account name, not individual author
    const accountEl = document.querySelector('#js_name');
    const authorMetaEl = document.querySelector('.rich_media_meta_text');
    
    // Extract author info more precisely
    let author = '';
    if (accountEl) {
      author = accountEl.textContent?.trim() || '';
    }
    
    // If no account name, try to get from meta text (usually the first one is author)
    if (!author && authorMetaEl) {
      const metaTexts = document.querySelectorAll('.rich_media_meta_text');
      if (metaTexts.length > 0) {
        author = metaTexts[0].textContent?.trim() || '';
      }
    }

    // WeChat publish time - more specific selector
    const publishTimeEl = document.querySelector('#publish_time') ||
                          document.querySelector('em.rich_media_meta_text') ||
                          document.querySelector('.rich_media_meta_text[id*="time"]');

    // WeChat content extraction - try multiple content containers
    const contentEl = document.querySelector('#js_content') ||
                      document.querySelector('.rich_media_content') ||
                      document.querySelector('#page-content .rich_media_content') ||
                      document.querySelector('[data-role="content"]');

    // If no main content found, try to extract from script tag (some WeChat articles load content via JS)
    let extractedContent = '';
    if (contentEl) {
      extractedContent = contentEl.innerHTML;
    } else {
      // Try to find content in script tags
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const scriptText = script.textContent || '';
        if (scriptText.includes('msg_content') || scriptText.includes('content_info')) {
          // Try to extract content from JavaScript
          const contentMatch = scriptText.match(/content['"]\s*:\s*['"]([^'"]+)['"]/);
          if (contentMatch) {
            extractedContent = contentMatch[1];
            break;
          }
        }
      }
    }

    // WeChat digest/description
    const digestEl = document.querySelector('meta[name="description"]') ||
                     document.querySelector('meta[property="og:description"]') ||
                     document.querySelector('.rich_media_meta_text');

    // Extract images from content or entire document
    const images = [];
    const imgContainers = [
      contentEl,
      document.querySelector('#page-content'),
      document.querySelector('.rich_media_area_primary'),
      document
    ].filter(Boolean);

    for (const container of imgContainers) {
      const imgElements = container.querySelectorAll('img[data-src], img[src]');
      
      imgElements.forEach((img, index) => {
        const src = img.getAttribute('data-src') || img.src;
        if (this.isValidImageUrl(src)) {
          // Avoid duplicates
          if (!images.find(existingImg => existingImg.src === src)) {
            images.push({
              src: src,
              alt: img.alt || '',
              index: images.length
            });
          }
        }
      });
      
      // If we found images, stop looking in other containers
      if (images.length > 0) break;
    }

    const title = titleEl ? titleEl.textContent.trim() : '';
    const publishTime = publishTimeEl ? publishTimeEl.textContent.trim() : '';
    
    // Clean up extracted content or use fallback
    let finalContent = extractedContent || '';
    if (!finalContent && contentEl) {
      finalContent = contentEl.innerHTML;
    }
    
    // If still no content, try to get text from the main article area
    if (!finalContent || finalContent.length < 100) {
      const mainArea = document.querySelector('.rich_media_area_primary') ||
                       document.querySelector('#page-content') ||
                       document.querySelector('.rich_media');
      if (mainArea) {
        // Get text content but preserve some structure
        finalContent = mainArea.innerHTML;
      }
    }

    return {
      title: title,
      author: author,
      publishTime: publishTime,
      content: finalContent,
      digest: digestEl ? (digestEl.content || digestEl.textContent || '').trim() : '',
      images: images,
      url: url,
      slug: title ? this.generateSlug(title) : '',
      timestamp: Date.now(),
      extractionMethod: 'wechat-selectors'
    };
  }

  enhanceWithWeChatMetadata(defuddleResult, document, url) {
    const authorEl = document.querySelector('#js_name') ||
                     document.querySelector('.rich_media_meta_text') ||
                     document.querySelector('.account_nickname_inner');

    const publishTimeEl = document.querySelector('#publish_time') ||
                          document.querySelector('.rich_media_meta_text');

    const digestEl = document.querySelector('.rich_media_meta_text') ||
                     document.querySelector('meta[name="description"]');

    // Extract images from cleaned content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = defuddleResult.content;
    const imgElements = tempDiv.querySelectorAll('img');
    const images = [];
    const seenUrls = new Set();

    imgElements.forEach((img, index) => {
      const src = img.getAttribute('data-src') || img.src;
      if (this.isValidImageUrl(src) && !seenUrls.has(src)) {
        seenUrls.add(src);
        images.push({
          src: src,
          alt: img.alt || '',
          index: index
        });
      }
    });

    const title = defuddleResult.title || '';
    
    return {
      title: title,
      author: defuddleResult.author || (authorEl ? authorEl.textContent.trim() : ''),
      publishTime: defuddleResult.published || (publishTimeEl ? publishTimeEl.textContent.trim() : ''),
      content: defuddleResult.content || '',
      digest: defuddleResult.description || (digestEl ? (digestEl.content || digestEl.textContent || '').trim() : ''),
      images: images,
      url: defuddleResult.url || url,
      slug: title ? this.generateSlug(title) : '',
      timestamp: Date.now(),
      extractionMethod: 'defuddle-enhanced-wechat',
      wordCount: defuddleResult.wordCount || 0,
      parseTime: defuddleResult.parseTime || 0,
      domain: defuddleResult.domain || '',
      site: defuddleResult.site || ''
    };
  }

  async extractGeneralContent(document, window, url) {
    if (this.options.verbose) {
      console.log(chalk.blue('\n🌐 Using general content extraction'));
    }

    try {
      const defuddle = new Defuddle(document, {
        debug: this.options.verbose,
        removeExactSelectors: false,  // 降低清理强度，避免误删正文
        removePartialSelectors: false // 降低清理强度
      });

      const result = defuddle.parse();

      if (!result || !result.content || result.content.length < 50) {
        if (this.options.verbose) {
          console.log(chalk.yellow('⚠️ Defuddle insufficient, using basic extraction'));
        }
        return this.extractBasicContent(document, url);
      }

      // Extract images from cleaned content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = result.content;
      const imgElements = tempDiv.querySelectorAll('img');
      const images = [];
      const seenUrls = new Set();

      imgElements.forEach((img, index) => {
        const src = img.src;
        if (this.isValidImageUrl(src) && !seenUrls.has(src)) {
          seenUrls.add(src);
          images.push({
            src: src,
            alt: img.alt || '',
            index: index
          });
        }
      });

      const title = result.title || document.title || '';

      return {
        title: title,
        author: result.author || '',
        publishTime: result.published || '',
        content: result.content || '',
        digest: result.description || '',
        images: images,
        url: result.url || url,
        slug: title ? this.generateSlug(title) : '',
        timestamp: Date.now(),
        extractionMethod: 'defuddle',
        wordCount: result.wordCount || 0,
        parseTime: result.parseTime || 0,
        domain: result.domain || '',
        site: result.site || ''
      };

    } catch (error) {
      if (this.options.verbose) {
        console.log(chalk.yellow(`⚠️ Defuddle failed: ${error.message}`));
      }
      return this.extractBasicContent(document, url);
    }
  }

  extractBasicContent(document, url) {
    if (this.options.verbose) {
      console.log(chalk.blue('\n📝 Using basic content extraction'));
    }

    // Try to find main content area
    const contentSelectors = [
      'article',
      'main',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      '.main-content',
      '[role="main"]'
    ];

    let contentEl = null;
    for (const selector of contentSelectors) {
      contentEl = document.querySelector(selector);
      if (contentEl && contentEl.textContent.length > 200) {
        break;
      }
    }

    // If no good content area, find largest text block
    if (!contentEl) {
      const allDivs = document.querySelectorAll('div, section, article');
      let maxLength = 0;
      for (const div of allDivs) {
        const textLength = div.textContent ? div.textContent.length : 0;
        if (textLength > maxLength && textLength > 200) {
          maxLength = textLength;
          contentEl = div;
        }
      }
    }

    // Extract images
    const images = [];
    const seenUrls = new Set();

    if (contentEl) {
      const imgElements = contentEl.querySelectorAll('img');
      imgElements.forEach((img, index) => {
        const src = img.src;
        if (this.isValidImageUrl(src) && !seenUrls.has(src)) {
          seenUrls.add(src);
          images.push({
            src: src,
            alt: img.alt || '',
            index: index
          });
        }
      });
    }

    const title = document.querySelector('h1')?.textContent?.trim() || 
                  document.title || 
                  '';

    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                     document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                     '';

    return {
      title: title,
      author: '',
      publishTime: '',
      content: contentEl ? contentEl.innerHTML : '',
      digest: metaDesc,
      images: images,
      url: url,
      slug: title ? this.generateSlug(title) : '',
      timestamp: Date.now(),
      extractionMethod: 'basic-fallback'
    };
  }

  mergeMetadata(article, metadata) {
    return {
      ...article,
      // Preserve original fields but enhance with metadata
      title: metadata.title || article.title,
      author: metadata.author || article.author,
      publishTime: metadata.published || article.publishTime,
      digest: metadata.description || article.digest,
      url: metadata.canonical || article.url,
      
      // Additional metadata fields
      siteName: metadata.siteName,
      language: metadata.language,
      tags: metadata.tags,
      readingTime: metadata.readingTime,
      created: metadata.created,
      
      // Enhanced extraction indicator
      extractionMethod: article.extractionMethod + '-enhanced-metadata'
    };
  }

  generateSlug(title) {
    if (!title || typeof title !== 'string') return '';
    
    try {
      // Use limax for better Chinese support
      const limax = require('limax');
      return limax(title, {
        tone: false,        // Remove tone marks for cleaner URLs
        replacement: '-',   // Use hyphen as separator
        lowercase: true,    // Convert to lowercase
        separator: '-'      // Explicit separator
      }).substring(0, 60);
    } catch (error) {
      console.warn('Limax slug generation failed, using fallback:', error.message);
      // Fallback slug generation
      return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60) || `article-${Date.now()}`;
    }
  }

  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const invalidPrefixes = [
      'data:', 'chrome-extension://', 'moz-extension://', 
      'chrome://', 'about:', 'javascript:', 'blob:'
    ];
    
    for (const prefix of invalidPrefixes) {
      if (url.startsWith(prefix)) return false;
    }
    
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  async sendToStrapi(article) {
    if (!this.strapiIntegration) {
      throw new Error('Strapi integration not initialized. Please provide Strapi configuration.');
    }

    return await this.strapiIntegration.sendToStrapi(article);
  }

  // 🔥 新增：获取图片实际尺寸（Node.js环境）
  async getImageDimensions(imageUrl) {
    try {
      // 在Node.js环境中使用sharp包获取图片尺寸
      const axios = require('axios');
      const sharp = require('sharp');
      
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        },
        timeout: 10000
      });
      
      const metadata = await sharp(Buffer.from(response.data)).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        aspectRatio: metadata.width / metadata.height
      };
    } catch (error) {
      if (this.options.verbose) {
        console.log(chalk.yellow(`⚠️ 无法获取图片尺寸: ${error.message}`));
      }
      // 返回默认值，表示无法检测
      return {
        width: 0,
        height: 0,
        aspectRatio: 1
      };
    }
  }

  // 🔥 新增：检查图片是否符合头图尺寸要求
  async isValidHeadImage(imageUrl, minWidth = 200, minHeight = 200) {
    try {
      const dimensions = await this.getImageDimensions(imageUrl);
      const isValid = dimensions.width >= minWidth && dimensions.height >= minHeight;
      
      if (this.options.verbose) {
        console.log(chalk.blue(`📏 图片尺寸检查: ${imageUrl.substring(0, 60)}...`));
        console.log(chalk.blue(`   尺寸: ${dimensions.width}x${dimensions.height}, 要求: ${minWidth}x${minHeight}, 符合: ${isValid ? '✅' : '❌'}`));
      }
      
      return {
        isValid,
        dimensions
      };
    } catch (error) {
      if (this.options.verbose) {
        console.log(chalk.yellow(`⚠️ 图片尺寸检查失败: ${error.message}`));
      }
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  // 🔥 新增：查找符合尺寸要求的头图
  async findValidHeadImage(images, minWidth = 200, minHeight = 200) {
    if (this.options.verbose) {
      console.log(chalk.blue(`🔍 查找符合尺寸要求的头图 (最小: ${minWidth}x${minHeight})`));
    }
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (this.options.verbose) {
        console.log(chalk.blue(`📸 检查第 ${i + 1} 张图片...`));
      }
      
      const validationResult = await this.isValidHeadImage(image.src, minWidth, minHeight);
      
      if (validationResult.isValid) {
        if (this.options.verbose) {
          console.log(chalk.green(`✅ 找到符合要求的头图: 索引 ${i}, 尺寸 ${validationResult.dimensions.width}x${validationResult.dimensions.height}`));
        }
        return {
          image,
          index: i,
          dimensions: validationResult.dimensions
        };
      }
    }
    
    if (this.options.verbose) {
      console.log(chalk.yellow('❌ 未找到符合尺寸要求的头图'));
    }
    return null;
  }

  // Process head image for Strapi upload
  async processHeadImage(article) {
    if (!article.images || article.images.length === 0) {
      if (this.options.verbose) {
        console.log(chalk.yellow('⚠️ No images found for head image processing'));
      }
      return article;
    }

    // 🔥 新增：根据尺寸要求查找合适的头图
    const minWidth = 200;  // 最小宽度
    const minHeight = 200; // 最小高度
    
    if (this.options.verbose) {
      console.log(chalk.blue(`🎯 查找符合尺寸要求的头图 (最小: ${minWidth}x${minHeight})`));
    }
    
    let targetImage;
    let targetIndex;
    let imageDimensions;
    
    // 如果指定了头图索引，先检查该索引的图片
    const specifiedIndex = this.options.config.advancedSettings?.headImgIndex || 0;
    const specifiedImage = article.images[specifiedIndex];
    
    if (specifiedImage) {
      if (this.options.verbose) {
        console.log(chalk.blue(`🎯 检查指定的头图索引 ${specifiedIndex}...`));
      }
      
      const validationResult = await this.isValidHeadImage(specifiedImage.src, minWidth, minHeight);
      
      if (validationResult.isValid) {
        targetImage = specifiedImage;
        targetIndex = specifiedIndex;
        imageDimensions = validationResult.dimensions;
        
        if (this.options.verbose) {
          console.log(chalk.green(`✅ 指定索引的图片符合要求: ${imageDimensions.width}x${imageDimensions.height}`));
        }
      } else {
        if (this.options.verbose) {
          console.log(chalk.yellow(`❌ 指定索引的图片不符合尺寸要求，将搜索其他图片...`));
        }
      }
    }
    
    // 如果指定索引的图片不符合要求，搜索所有图片
    if (!targetImage) {
      const validHeadImageResult = await this.findValidHeadImage(article.images, minWidth, minHeight);
      
      if (validHeadImageResult) {
        targetImage = validHeadImageResult.image;
        targetIndex = validHeadImageResult.index;
        imageDimensions = validHeadImageResult.dimensions;
      } else {
        if (this.options.verbose) {
          console.log(chalk.yellow('⚠️ 没有找到符合尺寸要求的头图，跳过头图处理'));
        }
        return {
          ...article,
          headImageError: `未找到符合尺寸要求的头图 (最小: ${minWidth}x${minHeight})`
        };
      }
    }

    if (this.options.verbose) {
      console.log(chalk.blue(`🖼️ 选择第 ${targetIndex + 1} 张图片作为头图: ${targetImage.src.substring(0, 60)}...`));
      console.log(chalk.blue(`📏 头图尺寸: ${imageDimensions.width}x${imageDimensions.height}`));
    }

    try {
      // Download and process the image
      const imageBuffer = await this.downloadImage(targetImage.src, article.url);
      const filename = this.generateHeadImageFilename(article.title, targetImage.src);

      // Upload to Strapi
      const uploadResult = await this.strapiIntegration.uploadImageToStrapi(
        imageBuffer, 
        filename, 
        {
          mimeType: this.getMimeTypeFromUrl(targetImage.src),
          isHeadImage: true,
          alt: targetImage.alt || `Head image for ${article.title}`,
          caption: `Head image for article: ${article.title}`
        }
      );

      if (uploadResult && uploadResult[0]) {
        const uploadedFile = uploadResult[0];
        
        if (this.options.verbose) {
          console.log(chalk.green(`✅ Head image uploaded: ${uploadedFile.name} (ID: ${uploadedFile.id})`));
          console.log(chalk.green(`📏 头图最终尺寸: ${imageDimensions.width}x${imageDimensions.height}`));
        }

        return {
          ...article,
          headImageId: uploadedFile.id,
          headImageUrl: uploadedFile.url,
          headImageInfo: {
            id: uploadedFile.id,
            url: uploadedFile.url,
            filename: uploadedFile.name,
            originalIndex: targetIndex,
            selectedIndex: targetIndex,
            originalUrl: targetImage.src,
            originalDimensions: imageDimensions
          }
        };
      }

      return article;

    } catch (error) {
      if (this.options.verbose) {
        console.error(chalk.red(`❌ Head image processing failed: ${error.message}`));
      }
      
      // Don't fail the entire process for head image errors
      return {
        ...article,
        headImageError: error.message
      };
    }
  }

  // Process and upload article images to Strapi
  async processArticleImages(article) {
    if (!article.images || article.images.length === 0) {
      return article;
    }

    const maxImages = this.options.config.advancedSettings?.maxImages || 10;
    const imagesToProcess = article.images.slice(0, maxImages);
    const processedImages = [];

    if (this.options.verbose) {
      console.log(chalk.blue(`📷 Processing ${imagesToProcess.length} images for Strapi upload...`));
    }

    for (let i = 0; i < imagesToProcess.length; i++) {
      const image = imagesToProcess[i];
      
      try {
        if (this.options.verbose) {
          console.log(chalk.blue(`📤 Processing image ${i + 1}/${imagesToProcess.length}: ${image.src.substring(0, 60)}...`));
        }

        // Download and process the image
        const imageBuffer = await this.downloadImage(image.src, article.url);
        const filename = this.generateImageFilename(image.src, i);

        // Upload to Strapi
        const uploadResult = await this.strapiIntegration.uploadImageToStrapi(
          imageBuffer, 
          filename, 
          {
            mimeType: this.getMimeTypeFromUrl(image.src),
            alt: image.alt || `Image ${i + 1}`,
            caption: `Image from article: ${article.title}`
          }
        );

        if (uploadResult && uploadResult[0]) {
          const uploadedFile = uploadResult[0];
          
          processedImages.push({
            original: image.src,
            uploaded: uploadedFile.url,
            id: uploadedFile.id,
            filename: uploadedFile.name,
            index: i,
            alt: image.alt
          });

          if (this.options.verbose) {
            console.log(chalk.green(`✅ Image ${i + 1} uploaded: ${uploadedFile.name}`));
          }
        }

      } catch (error) {
        if (this.options.verbose) {
          console.error(chalk.red(`❌ Image ${i + 1} upload failed: ${error.message}`));
        }
        
        // Continue with other images even if one fails
        processedImages.push({
          original: image.src,
          error: error.message,
          index: i
        });
      }
    }

    // Update content with new image URLs if smart replacement is enabled
    let updatedContent = article.content;
    if (this.options.config.advancedSettings?.smartImageReplace) {
      for (const processedImage of processedImages) {
        if (processedImage.uploaded) {
          updatedContent = this.replaceImageInContent(updatedContent, processedImage.original, processedImage.uploaded);
        }
      }
    }

    return {
      ...article,
      content: updatedContent,
      processedImages: processedImages,
      imageProcessingStats: {
        total: imagesToProcess.length,
        successful: processedImages.filter(img => img.uploaded).length,
        failed: processedImages.filter(img => img.error).length
      }
    };
  }

  // Download image from URL and return buffer
  async downloadImage(imageUrl, sourceUrl = null) {
    try {
      // Special handling for WeChat images
      const isWeChatImage = imageUrl.includes('mmbiz.qpic.cn') || imageUrl.includes('weixin');
      
      // Use mobile User-Agent for better compatibility with WeChat CDN
      const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
      
      const headers = {
        'User-Agent': isWeChatImage ? mobileUserAgent : this.options.userAgent,
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      };

      // Add WeChat-specific headers with proper Referer
      if (isWeChatImage) {
        // Use the actual article URL as Referer if available
        headers['Referer'] = sourceUrl || 'https://mp.weixin.qq.com/';
        headers['Origin'] = 'https://mp.weixin.qq.com';
        headers['Accept-Encoding'] = 'gzip, deflate, br';
        headers['Connection'] = 'keep-alive';
        // WeChat-specific headers
        headers['Sec-Ch-Ua'] = '"Safari";v="16", "WebKit";v="605"';
        headers['Sec-Ch-Ua-Mobile'] = '?1';
        headers['Sec-Ch-Ua-Platform'] = '"iOS"';
        headers['Upgrade-Insecure-Requests'] = '1';
      }

      if (this.options.verbose) {
        console.log(chalk.blue(`📥 Downloading image: ${imageUrl.substring(0, 60)}...`));
        if (isWeChatImage) {
          console.log(chalk.gray('  Using WeChat-specific headers'));
        }
      }

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: headers,
        maxRedirects: 3,
        validateStatus: (status) => status < 400
      });

      if (this.options.verbose) {
        console.log(chalk.green(`✅ Image downloaded: ${Math.round(response.data.length / 1024)}KB`));
      }

      return Buffer.from(response.data);

    } catch (error) {
      if (this.options.verbose) {
        console.log(chalk.red(`❌ Image download failed: ${error.message}`));
        if (error.response) {
          console.log(chalk.gray(`  Status: ${error.response.status}`));
          console.log(chalk.gray(`  Headers: ${JSON.stringify(error.response.headers)}`));
        }
      }
      throw new Error(`Failed to download image from ${imageUrl}: ${error.message}`);
    }
  }

  // Generate filename for head image
  generateHeadImageFilename(articleTitle, imageUrl) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 6);
    
    let baseName = 'head-img';
    
    if (articleTitle) {
      const titleSlug = articleTitle
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);
      
      if (titleSlug.length > 3) {
        baseName = `head-img-${titleSlug}`;
      }
    }
    
    const extension = this.getExtensionFromUrl(imageUrl) || 'jpg';
    return `${baseName}-${timestamp}-${randomId}.${extension}`;
  }

  // Generate filename for regular images
  generateImageFilename(imageUrl, index) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 8);
    const extension = this.getExtensionFromUrl(imageUrl) || 'jpg';
    
    return `article-image-${index + 1}-${timestamp}-${randomId}.${extension}`;
  }

  // Get file extension from URL
  getExtensionFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = pathname.split('.').pop()?.toLowerCase();
      
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      return validExtensions.includes(extension) ? extension : 'jpg';
    } catch {
      return 'jpg';
    }
  }

  // Get MIME type from URL
  getMimeTypeFromUrl(url) {
    const extension = this.getExtensionFromUrl(url);
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[extension] || 'image/jpeg';
  }

  // Replace image URLs in content
  replaceImageInContent(content, originalUrl, newUrl) {
    if (!content || !originalUrl || !newUrl) {
      return content;
    }

    // Create regex to match the original URL
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedUrl, 'g');
    
    return content.replace(regex, newUrl);
  }

  logExtractionSummary(article) {
    console.log(chalk.blue('\n📊 Extraction Summary:'));
    console.log(chalk.gray(`Method: ${article.extractionMethod}`));
    console.log(chalk.gray(`Title: ${article.title.substring(0, 60)}${article.title.length > 60 ? '...' : ''}`));
    console.log(chalk.gray(`Content: ${article.content.length} characters`));
    console.log(chalk.gray(`Images: ${article.images ? article.images.length : 0}`));
    if (article.wordCount) {
      console.log(chalk.gray(`Word count: ${article.wordCount}`));
    }
    if (article.readingTime) {
      console.log(chalk.gray(`Reading time: ${article.readingTime} minutes`));
    }
    if (article.tags && article.tags.length > 0) {
      console.log(chalk.gray(`Tags: ${article.tags.join(', ')}`));
    }
  }
}

export default ArticleExtractor;