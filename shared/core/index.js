/**
 * 共享核心模块索引
 * 统一导出所有核心功能
 */

// 导入类用于内部使用
import { WeChatExtractor } from './extractors/wechat-extractor.js';
import { StrapiIntegration } from './integrations/strapi-integration.js';

// 提取器
export { WeChatExtractor } from './extractors/wechat-extractor.js';

// 集成模块
export { StrapiIntegration } from './integrations/strapi-integration.js';

// 工具函数
export { 
  isValidImageUrl, 
  normalizeUrl, 
  extractDomain, 
  isWeChatArticleUrl, 
  cleanUrl 
} from '../utils/url-utils.js';

export { 
  generateSlug, 
  generatePreviewSlug, 
  isValidSlug 
} from '../utils/slug-utils.js';

// 常量
export { 
  WECHAT_SELECTORS, 
  CLEANUP_SELECTORS, 
  VERIFICATION_SELECTORS 
} from '../constants/selectors.js';

/**
 * 创建文章提取器实例
 * @param {Object} options - 配置选项
 * @returns {WeChatExtractor} 提取器实例
 */
export function createWeChatExtractor(options = {}) {
  return new WeChatExtractor(options);
}

/**
 * 创建Strapi集成实例
 * @param {Object} config - Strapi配置
 * @param {Object} options - 选项
 * @returns {StrapiIntegration} 集成实例
 */
export function createStrapiIntegration(config, options = {}) {
  return new StrapiIntegration(config, options);
}

/**
 * 创建完整的文章处理管道
 * @param {Object} config - 配置对象
 * @returns {Object} 处理管道
 */
export function createArticlePipeline(config = {}) {
  const extractorOptions = {
    environment: config.environment || 'browser',
    verbose: config.verbose || false,
    debug: config.debug || false,
    ...config.extractorOptions
  };

  const extractor = new WeChatExtractor(extractorOptions);
  
  let strapiIntegration = null;
  if (config.strapi) {
    const strapiOptions = {
      environment: extractorOptions.environment,
      verbose: extractorOptions.verbose,
      debug: extractorOptions.debug,
      ...config.strapiOptions
    };
    strapiIntegration = new StrapiIntegration(config.strapi, strapiOptions);
  }

  return {
    extractor,
    strapiIntegration,
    
    /**
     * 处理文章的完整流程
     * @param {Document|string} documentOrUrl - DOM文档或URL
     * @param {string} url - URL（如果第一个参数是Document）
     * @returns {Promise<Object>} 处理结果
     */
    async process(documentOrUrl, url = null) {
      let document, articleUrl;

      // 参数处理
      if (typeof documentOrUrl === 'string') {
        articleUrl = documentOrUrl;
        // 如果是URL，需要获取文档（在适配器中实现）
        throw new Error('URL参数需要在适配器中处理，请直接传入document对象');
      } else {
        document = documentOrUrl;
        articleUrl = url || (document.defaultView ? document.defaultView.location.href : '');
      }

      // 提取文章
      const article = await extractor.extract(document, articleUrl);

      // 发送到Strapi（如果配置了）
      let strapiResult = null;
      if (strapiIntegration) {
        strapiResult = await strapiIntegration.sendToStrapi(article);
      }

      return {
        article,
        strapi: strapiResult
      };
    }
  };
} 