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
      this.log('导航到页面...', { url });
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: this.playwrightOptions.waitTimeout 
      });

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
      this.log(`获取页面内容失败: ${error.message}`, { url }, 'error');
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

      // 金融八卦女等动态网站特殊处理
      if (urlObj.hostname.includes('jinrongbaguanv.com')) {
        this.log('检测到金融八卦女网站，使用专门的等待策略...');
        
        await this.waitForJinrongbaguanvContent(page);
        return;
      }

      // 如果指定了等待选择器
      if (this.playwrightOptions.waitForSelector) {
        this.log(`等待选择器: ${this.playwrightOptions.waitForSelector}`);
        await page.waitForSelector(this.playwrightOptions.waitForSelector, {
          timeout: this.playwrightOptions.waitTimeout
        });
        this.log('选择器已出现');
        return;
      }

      // 通用等待策略：多重策略确保内容完全加载
      await this.waitForGeneralContent(page);

    } catch (error) {
      this.log(`等待页面内容时发生错误: ${error.message}`, null, 'warn');
      // 不抛出错误，允许继续处理部分加载的内容
    }
  }

  /**
   * 金融八卦女网站专门的等待策略
   */
  async waitForJinrongbaguanvContent(page) {
    try {
      this.log('开始等待金融八卦女网站内容加载...');

      // 第一阶段：等待基础页面加载
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => this.log('DOM content loaded timeout, continuing...', null, 'debug'));
      this.log('DOM内容已加载');

      // 第二阶段：等待更多具体的内容元素
      const contentLoaded = await Promise.race([
        // 方案1：等待具体的文章内容（更长的内容）
        page.waitForFunction(() => {
          const selectors = ['.article-content', '.content', '.detail-content', '.news-content', '.main-content', '.post-content', '.text-content', '.article-body', 'main', 'article', '[class*="content"]', '[class*="detail"]', '[class*="article"]', '[class*="news"]'];
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              if (element && element.innerText) {
                const text = element.innerText.trim();
                if (text.length > 1000 && (text.includes('降准降息') || text.includes('潘功胜') || text.includes('三大类政策') || text.includes('十项措施'))) {
                  console.log('找到匹配内容区域:', selector, '长度:', text.length);
                  return true;
                }
              }
            }
          }
          return false;
        }, { timeout: this.playwrightOptions.waitTimeout }).catch(() => {
          this.log('Wait for function timed out', null, 'debug');
          return false;
        }),

        // 方案2：等待网络空闲
        page.waitForLoadState('networkidle', { timeout: Math.min(this.playwrightOptions.waitTimeout, 20000) })
          .then(() => {
            this.log('网络空闲状态达成');
            return true;
          }).catch(() => {
            this.log('Wait for network idle timed out', null, 'debug');
            return false;
          }),

        // 方案3：等待图片加载（如果启用）
        this.playwrightOptions.loadImages ?
          page.waitForFunction(() => {
            const images = Array.from(document.images);
            const loadedImages = images.filter(img => img.complete && img.naturalHeight > 0);
            return images.length > 0 && loadedImages.length >= Math.min(images.length, 2);
          }, { timeout: Math.min(this.playwrightOptions.waitTimeout, 15000) })
            .then(() => {
              this.log('图片已加载');
              return true;
            }).catch(() => {
              this.log('Wait for images timed out', null, 'debug');
              return false;
            }) :
          Promise.resolve(true)
      ]);

      if (contentLoaded) {
        this.log('内容匹配成功');
      }

      // 第三阶段：额外等待确保所有动态内容加载完成
      const additionalWait = Math.max(3000, this.playwrightOptions.waitTimeout * 0.1);
      this.log(`额外等待 ${additionalWait}ms 确保动态内容完全加载...`);
      await new Promise(resolve => setTimeout(resolve, additionalWait));

      this.log('准备验证内容质量 (pre-evaluate)');
      // 验证内容质量
      const contentInfo = await page.evaluate(() => {
        console.log('[evaluate] 开始验证内容质量');
        const body = document.body;
        const bodyText = body ? body.innerText : '';
        const articleKeywords = ['降准降息', '潘功胜', '三大类政策', '十项措施'];
        const hasKeywords = articleKeywords.some(keyword => bodyText.includes(keyword));
        
        const result = {
          bodyTextLength: bodyText.length,
          hasKeywords: hasKeywords,
          title: document.title
        };
        console.log('[evaluate] 内容质量验证完成, 结果:', JSON.stringify(result));
        return result;
      });
      
      this.log('内容质量验证成功 (post-evaluate)');
      this.log('内容验证结果', contentInfo);
      this.log('金融八卦女网站内容已加载');

    } catch (error) {
      this.log(`金融八卦女网站等待策略出现错误: ${error.message}`, null, 'warn');
      this.log('使用已加载内容继续处理', null, 'warn');
    }
  }

  /**
   * 通用内容等待策略
   */
  async waitForGeneralContent(page) {
    try {
      // 多重策略确保内容加载
      await Promise.all([
        // 策略1：等待网络空闲
        page.waitForLoadState('networkidle', { timeout: Math.min(this.playwrightOptions.waitTimeout, 10000) })
          .catch(() => this.log('网络空闲等待超时', null, 'debug')),
        
        // 策略2：等待主要内容区域
        this.waitForCommonContentSelectors(page)
          .catch(() => this.log('内容选择器等待超时', null, 'debug')),
        
        // 策略3：等待文档就绪和基本内容
        page.waitForFunction(() => {
          return document.readyState === 'complete' && 
                 document.body && 
                 document.body.innerText.length > 100;
        }, { timeout: this.playwrightOptions.waitTimeout })
          .catch(() => this.log('文档就绪等待超时', null, 'debug'))
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
      // 等待任意一个内容选择器出现并有足够内容
      await page.waitForFunction((selectors) => {
        return selectors.some(selector => {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (element && element.textContent && element.textContent.trim().length > 200) {
              return true;
            }
          }
          return false;
        });
      }, commonSelectors, { timeout: Math.min(this.playwrightOptions.waitTimeout, 10000) });
      
      this.log('检测到主要内容区域');
    } catch (error) {
      // 尝试更宽松的条件
      try {
        await page.waitForFunction(() => {
          // 检查页面是否有足够的文本内容
          const bodyText = document.body ? document.body.innerText : '';
          return bodyText.length > 500;
        }, { timeout: 5000 });
        
        this.log('检测到足够的页面文本内容');
      } catch (secondError) {
        this.log('未检测到常见内容选择器，继续执行', null, 'debug');
      }
    }
  }

  /**
   * 重写 extractFromUrl 方法以确保浏览器正确关闭
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
          const articleKeywords = ['降准降息', '潘功胜', '三大类政策', '十项措施'];
          const hasKeywords = articleKeywords.some(keyword => actualVisibleText.includes(keyword));
          const keywordMatches = articleKeywords.filter(keyword => actualVisibleText.includes(keyword));
          
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