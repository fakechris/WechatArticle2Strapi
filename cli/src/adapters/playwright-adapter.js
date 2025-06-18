/**
 * Playwright适配器
 * 使用 Playwright 无头浏览器获取动态渲染的页面内容
 * 继承 CLIAdapter 的所有功能，只替换页面获取部分
 */

import { chromium, firefox, webkit } from 'playwright';
import chalk from 'chalk';
import { CLIAdapter } from './cli-adapter.js';

export class PlaywrightAdapter extends CLIAdapter {
  constructor(options = {}) {
    // 🔧 关键修复：Playwright提供完整浏览器环境，设置为'browser'
    const playwrightOptions = {
      ...options,
      environment: 'browser' // 强制设置为浏览器环境
    };
    
    super(playwrightOptions);
    
    this.playwrightOptions = {
      browser: 'chromium', // chromium, firefox, webkit
      headless: true,
      waitForSelector: null, // 等待特定选择器
      waitTimeout: 30000,
      loadImages: false, // 默认不加载图片以提高速度
      stealth: true, // 启用隐身模式
      viewport: { width: 1920, height: 1080 },
      userDataDir: null,
      ...options.playwright
    };

    this.browser = null;
    this.context = null;
    this.log('Playwright适配器初始化完成', { 
      browser: this.playwrightOptions.browser,
      headless: this.playwrightOptions.headless 
    });
  }

  /**
   * 启动浏览器
   * @returns {Promise<void>}
   */
  async launchBrowser() {
    if (this.browser) {
      return; // 浏览器已启动
    }

    try {
      this.log('启动浏览器...', { browser: this.playwrightOptions.browser });

      const browserOptions = {
        headless: this.playwrightOptions.headless,
        timeout: this.playwrightOptions.waitTimeout
      };

      // 选择浏览器引擎
      switch (this.playwrightOptions.browser) {
        case 'firefox':
          this.browser = await firefox.launch(browserOptions);
          break;
        case 'webkit':
          this.browser = await webkit.launch(browserOptions);
          break;
        case 'chromium':
        default:
          this.browser = await chromium.launch(browserOptions);
          break;
      }

      // 创建浏览器上下文
      const contextOptions = {
        viewport: this.playwrightOptions.viewport,
        userAgent: this.options.userAgent,
        bypassCSP: true, // 绕过内容安全策略
        ignoreHTTPSErrors: true
      };

      if (this.playwrightOptions.userDataDir) {
        contextOptions.userDataDir = this.playwrightOptions.userDataDir;
      }

      this.context = await this.browser.newContext(contextOptions);

      // 配置请求拦截以优化性能
      if (!this.playwrightOptions.loadImages) {
        await this.context.route('**/*', (route) => {
          const resourceType = route.request().resourceType();
          if (resourceType === 'image' || resourceType === 'font' || resourceType === 'stylesheet') {
            route.abort();
          } else {
            route.continue();
          }
        });
      }

      this.log('浏览器启动成功');

    } catch (error) {
      this.log(`浏览器启动失败: ${error.message}`, null, 'error');
      throw new Error(`浏览器启动失败: ${error.message}`);
    }
  }

  /**
   * 关闭浏览器
   * @returns {Promise<void>}
   */
  async closeBrowser() {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.log('浏览器已关闭');
    } catch (error) {
      this.log(`关闭浏览器时发生错误: ${error.message}`, null, 'warn');
    }
  }

  /**
   * 使用 Playwright 获取页面内容
   * 重写父类的 fetchHtmlContent 方法
   * @param {string} url - URL
   * @returns {Promise<string>} HTML内容
   */
  async fetchHtmlContent(url) {
    this.log('Entering fetchHtmlContent', { url }, 'debug');
    this.log('使用 Playwright 获取页面内容...', { url });

    let page = null;
    
    try {
      // 启动浏览器
      await this.launchBrowser();
      
      // 创建新页面
      page = await this.context.newPage();

      // 增加浏览器控制台日志输出
      page.on('console', msg => {
        const type = msg.type().toUpperCase();
        const text = msg.text();
        this.log(`[Browser Console] ${type}: ${text}`, null, 'debug');
      });

      // 设置超时
      page.setDefaultTimeout(this.playwrightOptions.waitTimeout);
      page.setDefaultNavigationTimeout(this.playwrightOptions.waitTimeout);

      // 导航到页面
      this.log('Attempting page.goto()', { url }, 'debug');
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: this.playwrightOptions.waitTimeout 
      });
      this.log(`page.goto() completed. Response status: ${response ? response.status() : 'N/A'}`, null, 'debug');

      if (!response || !response.ok()) {
        throw new Error(`页面加载失败: ${response ? response.status() : 'no response'}`);
      }

      // 等待页面内容加载
      await this.waitForPageContent(page, url);

      // 获取页面HTML内容
      const htmlContent = await page.content();
      
      this.log('页面内容获取成功', { 
        contentLength: htmlContent.length,
        url: page.url() 
      });

      return htmlContent;

    } catch (error) {
      this.log(`Error in fetchHtmlContent (possibly page.goto or subsequent logic): ${error.message}`, { url, stack: error.stack }, 'error');
      throw error;
    } finally {
      // 关闭页面
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          this.log(`关闭页面时发生错误: ${closeError.message}`, null, 'warn');
        }
      }
    }
  }

  /**
   * 等待页面内容加载完成
   * @param {Page} page - Playwright 页面对象
   * @param {string} url - 页面URL
   * @returns {Promise<void>}
   */
  async waitForPageContent(page, url) {
    try {
      const urlObj = new URL(url);
      
      // 微信文章特殊处理
      if (urlObj.hostname === 'mp.weixin.qq.com') {
        this.log('检测到微信文章，等待内容加载...');
        
        // 等待微信文章内容区域加载
        await Promise.race([
          page.waitForSelector('.rich_media_content', { timeout: this.playwrightOptions.waitTimeout }),
          page.waitForSelector('#js_content', { timeout: this.playwrightOptions.waitTimeout }),
          page.waitForFunction(() => {
            const content = document.querySelector('.rich_media_content, #js_content');
            return content && content.children.length > 0;
          }, { timeout: this.playwrightOptions.waitTimeout })
        ]);
        
        this.log('微信文章内容已加载');
        return;
      }

      // 通用等待逻辑
      this.log('Phase 2: Applying general content waiting strategies...');
      if (url.includes('mp.weixin.qq.com')) {
        // 针对微信公众号文章的特殊等待逻辑 (保持这个，因为微信页面结构非常特殊)
        this.log('Using WeChat specific waiting strategy.');
        await this.waitForWeChatContent(page);
      } else {
        // 对于其他所有网站，使用增强的通用等待逻辑
        this.log('Using enhanced general waiting strategy.');
        await this.waitForGeneralContent(page);
      }

      // Phase 3: Additional fixed wait for dynamic content
      const additionalWait = Math.max(2000, this.playwrightOptions.waitTimeout * 0.1); // Min 2s wait
      this.log(`Phase 3: Adding an additional wait of ${additionalWait}ms for any remaining dynamic content...`);
      await new Promise(resolve => setTimeout(resolve, additionalWait));
      
      // Phase 4: Final content quality check (logging only)
      this.log('Phase 4: Performing final content quality check (logging only)...');
      const contentInfo = await page.evaluate(() => {
        const body = document.body;
        const bodyText = body ? body.innerText : '';
        return {
          bodyTextLength: bodyText.length,
          title: document.title
        };
      });
      this.log('Final content check results:', contentInfo);

      this.log('All page content waiting strategies completed.');
    } catch (error) {
      this.log(`Page waiting strategy encountered an error: ${error.message}`, null, 'warn');
      // Even if waiting strategies fail, attempt to continue extraction
      this.log('Attempting to proceed with currently loaded content.', null, 'warn');
    }
  }
  /**
   * 通用内容等待策略
   */
  async waitForGeneralContent(page) {
    this.log('Entering waitForGeneralContent', null, 'debug');
    try {
      // 多重策略确保内容加载
      await Promise.all([
        // 策略1：等待网络空闲
        page.waitForLoadState('networkidle', { timeout: Math.min(this.playwrightOptions.waitTimeout, 10000) })
          .catch(() => this.log('网络空闲等待超时', null, 'debug')),
        
        // 策略2：等待主要内容区域
        (async () => { // IIFE to allow await inside Promise.all and keep logging precise
          this.log('waitForGeneralContent: Attempting to call waitForCommonContentSelectors', null, 'debug');
          await this.waitForCommonContentSelectors(page);
        })()
          .catch((err) => this.log(`waitForGeneralContent: Error in waitForCommonContentSelectors or its promise: ${err.message}`, null, 'warn')),
        
        // 策略3：等待文档就绪和基本内容
        page.waitForFunction(() => {
          return document.readyState === 'complete' && 
                 document.body && 
                 document.body.innerText.length > 100;
        }, { timeout: this.playwrightOptions.waitTimeout })
          .catch(() => this.log('文档就绪等待超时', null, 'debug')),

        // 策略4：等待图片加载（如果启用）
        this.playwrightOptions.loadImages ?
          page.waitForFunction(() => {
            const images = Array.from(document.images);
            const loadedImages = images.filter(img => img.complete && img.naturalHeight > 0);
            // Wait for at least a few images to load if there are many, or all if there are few.
            return images.length > 0 && loadedImages.length >= Math.min(images.length, 2); 
          }, { timeout: Math.min(this.playwrightOptions.waitTimeout, 15000) })
            .then(() => {
              this.log('图片已加载');
            }).catch(() => {
              this.log('Wait for images timed out', null, 'debug');
            }) :
          Promise.resolve(true) // If not loading images, resolve immediately
      ]);

      // 额外等待时间让动态内容完成渲染
      const additionalWait = Math.min(3000, this.playwrightOptions.waitTimeout / 10);
      await new Promise(resolve => setTimeout(resolve, additionalWait));
      
      this.log('通用内容加载完成');

    } catch (error) {
      this.log(`通用等待策略错误: ${error.message}`, null, 'warn');
    }
  }

  /**
   * 等待常见的内容选择器
   * @param {Page} page - Playwright 页面对象
   * @returns {Promise<void>}
   */
  async waitForCommonContentSelectors(page) {
    this.log('Entering waitForCommonContentSelectors', null, 'debug');
    const commonSelectors = [
      'article',
      'main',
      '.content, .article-content, .post-content',
      '.entry-content, .article-body, .story-body',
      '.detail-content, .news-content, .text-content',
      '.article-detail, .post-detail, .news-detail',
      '[role="main"], [role="article"]',
      // 移动端常见选择器
      '.mobile-content, .m-content, .app-content'
    ];

    try {
      this.log('Attempting SIMPLIFIED primary waitForFunction in waitForCommonContentSelectors...', null, 'debug');
      await page.waitForFunction(() => {
        console.log('[PW DEBUG INJECTED] Checking body innerText length in SIMPLIFIED waitForCommonContentSelectors (target: >200). Current length: ' + (document.body ? document.body.innerText.length : 'N/A'));
        const result = document.body && document.body.innerText && document.body.innerText.length > 200;
        console.log('[PW DEBUG INJECTED] Result of body.innerText.length > 200: ' + result);
        return result;
      }, { timeout: Math.min(this.playwrightOptions.waitTimeout, 10000) });
      this.log('SIMPLIFIED primary waitForFunction (target: >200) in waitForCommonContentSelectors completed successfully.', null, 'debug');
    } catch (error) {
      this.log(`SIMPLIFIED primary waitForFunction in waitForCommonContentSelectors FAILED: ${error.message}`, null, 'warn');
      this.log('Attempting fallback: checking for sufficient body text length (original fallback logic)...', null, 'debug');
      try {
        await page.waitForFunction(() => {
          console.log('[PW DEBUG INJECTED FALLBACK] Checking body innerText length. Current length: ' + (document.body ? document.body.innerText.length : 'N/A'));
          const result = document.body && document.body.innerText && document.body.innerText.length > 500; // Original fallback length check
          console.log('[PW DEBUG INJECTED FALLBACK] Result of body.innerText.length > 500: ' + result);
          return result;
        }, { timeout: 5000 }); // Original fallback timeout
        this.log('Successfully found sufficient body text length (via fallback).', null, 'debug');
      } catch (secondError) {
        this.log(`Fallback waitForFunction in waitForCommonContentSelectors FAILED: ${secondError.message}`, null, 'warn');
        this.log('Neither simplified primary nor fallback detected sufficient content in waitForCommonContentSelectors. Continuing.', null, 'debug');
      }
    }
    this.log('Exiting waitForCommonContentSelectors', null, 'debug');
  }

  /**
   * 主提取方法，重写以适配Playwright.
   * @param {string} url - 文章URL
   * @returns {Promise<Object>} 提取结果
   */
  async extractFromUrl(url) {
    this.log(`开始提取文章: ${url}`);

    try {
      // 🔧 关键修复：使用Playwright获取完整渲染的HTML，然后在Node.js中处理
      // 但告诉WeChatExtractor这是浏览器环境，这样它会使用正确的DOM API
      const htmlContent = await this.fetchHtmlContent(url);
      
      // 解析为DOM，使用JSDOM但配置为浏览器环境
      const { JSDOM } = await import('jsdom');
      const dom = new JSDOM(htmlContent, { 
        url: url,
        resources: 'usable',
        runScripts: 'outside-only',
        pretendToBeVisual: true,
        virtualConsole: this.createVirtualConsole()
      });

      // 为JSDOM window添加浏览器API polyfills
      this.polyfillBrowserAPIs(dom.window);

      // 🔧 关键：使用共享核心逻辑提取，environment已经设置为'browser'
      // 这样WeChatExtractor会使用浏览器的DOM API而不是Node.js简化版本
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
    } finally {
      // 确保浏览器关闭
      await this.closeBrowser();
    }
  }

  /**
   * 获取 Playwright 特定的页面信息
   * @param {string} url - URL
   * @returns {Promise<Object>} 页面信息
   */
  async getPageInfo(url) {
    await this.launchBrowser();
    const page = await this.context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await this.waitForPageContent(page, url);

      const pageInfo = await page.evaluate(() => {
        // 分析页面结构
        const contentElements = [];
        const selectors = [
          'article', 'main', '.content', '.article-content', '.post-content',
          '.entry-content', '.article-body', '.story-body', '.detail-content',
          '.news-content', '.text-content', '.article-detail', '.post-detail',
          '.news-detail', '[role="main"]', '[role="article"]'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el, index) => {
            if (el && el.textContent && el.textContent.trim().length > 50) {
              contentElements.push({
                selector: selector,
                index: index,
                textLength: el.textContent.trim().length,
                innerHTMLLength: el.innerHTML.length,
                className: el.className || '',
                id: el.id || '',
                tagName: el.tagName
              });
            }
          });
        });

        return {
          title: document.title,
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          loadedResources: performance.getEntriesByType('resource').length,
          bodyTextLength: document.body ? document.body.innerText.length : 0,
          contentElements: contentElements.slice(0, 10), // 只返回前10个
          timestamp: new Date().toISOString()
        };
      });

      return pageInfo;
    } finally {
      await page.close();
    }
  }

  /**
   * 调试页面内容结构
   * @param {string} url - URL
   * @returns {Promise<Object>} 页面结构信息
   */
  async debugPageStructure(url) {
    await this.launchBrowser();
    const page = await this.context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await this.waitForPageContent(page, url);

      const structureInfo = await page.evaluate(() => {
        const getElementInfo = (element) => {
          return {
            tagName: element.tagName,
            className: element.className || '',
            id: element.id || '',
            textLength: element.textContent ? element.textContent.trim().length : 0,
            childrenCount: element.children.length,
            innerHTML: element.innerHTML.substring(0, 200) + (element.innerHTML.length > 200 ? '...' : '')
          };
        };

        // 寻找主要内容区域
        const potentialContentAreas = [];
        const allElements = document.querySelectorAll('*');
        
        for (const element of allElements) {
          if (element.textContent && element.textContent.trim().length > 300) {
            const info = getElementInfo(element);
            if (info.textLength > 300 && info.childrenCount > 0) {
              potentialContentAreas.push(info);
            }
          }
        }
        
        // 按文本长度排序
        potentialContentAreas.sort((a, b) => b.textLength - a.textLength);

        return {
          title: document.title,
          bodyTextLength: document.body ? document.body.innerText.length : 0,
          totalElements: allElements.length,
          potentialContentAreas: potentialContentAreas.slice(0, 5),
          scripts: Array.from(document.scripts).length,
          images: Array.from(document.images).length
        };
      });

      return structureInfo;
    } finally {
      await page.close();
    }
  }

     /**
    * 实时内容质量检查
    * @param {string} url - URL
    * @returns {Promise<Object>} 内容质量报告
    */
   async checkContentQuality(url) {
     await this.launchBrowser();
     const page = await this.context.newPage();
     
     try {
       await page.goto(url, { waitUntil: 'domcontentloaded' });
       await this.waitForPageContent(page, url);

               const qualityReport = await page.evaluate(() => {
          // 更精确的页面内容质量分析
          const body = document.body;
          const bodyText = body ? body.innerText.trim() : '';
          
          // 计算实际可见文本（排除隐藏元素）
          const getVisibleText = (element) => {
            if (!element) return '';
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
              return '';
            }
            
            let text = '';
            for (const child of element.childNodes) {
              if (child.nodeType === Node.TEXT_NODE) {
                text += child.textContent;
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                // 跳过script和style标签
                if (child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') {
                  text += getVisibleText(child);
                }
              }
            }
            return text;
          };
          
          const actualVisibleText = getVisibleText(body);
          const chineseChars = (actualVisibleText.match(/[\u4e00-\u9fff]/g) || []).length;
          
          // 寻找最佳内容容器
          const contentSelectors = [
            '.article-content', '.content', '.detail-content', '.news-content',
            '.main-content', '.post-content', '.text-content', '.article-body',
            'main', 'article', '[class*="content"]', '[class*="detail"]',
            '[class*="article"]', '[class*="news"]', '[class*="post"]'
          ];
          
          const contentAreas = [];
          contentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el, index) => {
              if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
                const text = getVisibleText(el).trim();
                const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
                
                if (text.length > 100 && chineseCount > 50) {
                  contentAreas.push({
                    selector: selector,
                    index: index,
                    textLength: text.length,
                    chineseChars: chineseCount,
                    className: el.className || '',
                    id: el.id || '',
                    hasImages: el.querySelectorAll('img').length,
                    textPreview: text.substring(0, 300) + (text.length > 300 ? '...' : ''),
                    qualityScore: chineseCount / Math.max(text.length, 1) // 中文字符占比作为质量分数
                  });
                }
              }
            });
          });
          
          // 按质量分数和文本长度排序
          contentAreas.sort((a, b) => {
            const scoreA = a.qualityScore * 0.7 + (a.textLength / 10000) * 0.3;
            const scoreB = b.qualityScore * 0.7 + (b.textLength / 10000) * 0.3;
            return scoreB - scoreA;
          });
          
          // 关键词检查
          // Keyword-specific logic removed for general applicability
          // const hasKeywords = articleKeywords.some(keyword => actualVisibleText.includes(keyword));
          // const keywordMatches = articleKeywords.filter(keyword => actualVisibleText.includes(keyword));
          
          // 图片分析
          const images = Array.from(document.images);
          const visibleImages = images.filter(img => 
            img.offsetWidth > 0 && img.offsetHeight > 0 && 
            img.src && !img.src.includes('data:image') && 
            img.complete && img.naturalHeight > 0
          );
          
          return {
            title: document.title,
            bodyTextLength: bodyText.length,
            actualVisibleTextLength: actualVisibleText.length,
            chineseCharsCount: chineseChars,
            textQualityRatio: chineseChars / Math.max(actualVisibleText.length, 1),
            hasKeywords: hasKeywords,
            keywordMatches: keywordMatches,
            contentAreas: contentAreas.slice(0, 3),
            imageCount: images.length,
            visibleImageCount: visibleImages.length,
            imageDetails: visibleImages.slice(0, 5).map(img => ({
              src: img.src.substring(0, 100) + (img.src.length > 100 ? '...' : ''),
              alt: img.alt || '',
              width: img.width,
              height: img.height
            })),
            readyState: document.readyState,
            scriptCount: document.scripts.length
          };
        });

       return qualityReport;
     } finally {
       await page.close();
     }
   }

   /**
    * 截图功能（调试用）
    * @param {string} url - URL
    * @param {string} filename - 截图文件名
    * @returns {Promise<Buffer>} 截图数据
    */
   async takeScreenshot(url, filename = null) {
     if (!this.options.debug) {
       return null; // 只在调试模式下截图
     }

     await this.launchBrowser();
     const page = await this.context.newPage();
     
     try {
       await page.goto(url, { waitUntil: 'domcontentloaded' });
       await this.waitForPageContent(page, url);

       // First, get the final rendered HTML from the page
       const html = await page.content();
       if (!html) {
         throw new Error('Failed to get HTML content from the page.');
       }

       // Now, parse it with JSDOM to create a standard `document` object
       const { JSDOM } = require('jsdom');
       const dom = new JSDOM(html, { url });

       // Finally, pass the JSDOM `document` to the extractor
       const article = await this.extractor.extract(dom.window.document, url);

       const screenshotPath = filename || `screenshot-${Date.now()}.png`;
       const screenshot = await page.screenshot({ 
         path: screenshotPath,
         fullPage: true 
       });

       this.log(`截图已保存: ${screenshotPath}`, null, 'debug');
       return screenshot;
     } finally {
       await page.close();
     }
   }
} 