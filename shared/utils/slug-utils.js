/**
 * Slug生成工具函数
 * 统一CLI和扩展中的Slug生成逻辑
 */

// 懒加载limax模块
let limaxCache = null;

/**
 * 获取limax模块（懒加载）
 * @returns {Function|null} limax函数或null
 */
function getLimax() {
  if (limaxCache === null) {
    try {
      // 尝试使用require（CommonJS环境）
      if (typeof require !== 'undefined') {
        limaxCache = require('limax');
      } else {
        // ES modules环境，标记为不可用
        limaxCache = false;
      }
    } catch (error) {
      console.warn('Limax module not available:', error.message);
      limaxCache = false;
    }
  }
  return limaxCache === false ? null : limaxCache;
}

/**
 * 生成文章Slug
 * @param {string} title - 文章标题
 * @param {Object} options - 配置选项
 * @returns {string} 生成的slug
 */
export function generateSlug(title, options = {}) {
  if (!title || typeof title !== 'string') {
    return '';
  }

  const defaultOptions = {
    replacement: '-',
    maxLength: 60,
    locale: 'zh',
    strict: false,
    trim: true,
    ...options
  };

  try {
    // 优先使用limax库
    const limax = getLimax();
    if (limax) {
      return limax(title, {
        tone: false,
        replacement: defaultOptions.replacement,
        lowercase: true,
        separator: defaultOptions.replacement
      }).substring(0, defaultOptions.maxLength);
    }

    // 浏览器环境，使用slug库（如果可用）
    if (typeof window !== 'undefined' && window.slug) {
      return window.slug(title, {
        replacement: defaultOptions.replacement,
        remove: /[*+~.()'"!:@]/g,
        lower: true,
        strict: defaultOptions.strict,
        locale: defaultOptions.locale,
        trim: defaultOptions.trim
      }).substring(0, defaultOptions.maxLength);
    }

    // 回退到自定义实现
    return generateSlugFallback(title, defaultOptions);
  } catch (error) {
    console.warn('Slug生成失败，使用回退方案:', error);
    return generateSlugFallback(title, defaultOptions);
  }
}

/**
 * 回退的Slug生成实现
 * @param {string} title - 标题
 * @param {Object} options - 选项
 * @returns {string} slug
 */
function generateSlugFallback(title, options) {
  let slug = title.trim();

  // 中文处理 - 转换为拼音或使用简化方案
  slug = slug
    // 移除HTML标签
    .replace(/<[^>]*>/g, '')
    // 替换中文标点符号
    .replace(/[，。！？；：""''（）【】]/g, '')
    // 替换英文标点符号为连字符
    .replace(/[*+~.()'"!:@]/g, '')
    .replace(/[,\.\!\?\;\:\"\']/g, '-')
    // 替换空格为连字符
    .replace(/\s+/g, '-')
    // 移除多余的连字符
    .replace(/-+/g, '-')
    // 移除开头和结尾的连字符
    .replace(/^-+|-+$/g, '')
    // 转换为小写
    .toLowerCase();

  // 中文字符处理：如果包含中文，使用简化方案
  if (/[\u4e00-\u9fff]/.test(slug)) {
    slug = generateChineseSlug(title, options);
  }

  // 限制长度
  if (slug.length > options.maxLength) {
    slug = slug.substring(0, options.maxLength);
    // 确保不在单词中间截断
    const lastDash = slug.lastIndexOf('-');
    if (lastDash > options.maxLength - 10) {
      slug = slug.substring(0, lastDash);
    }
  }

  // 如果结果为空，使用时间戳
  if (!slug || slug.length < 3) {
    slug = `article-${Date.now()}`;
  }

  return slug;
}

/**
 * 中文Slug生成
 * @param {string} title - 中文标题
 * @param {Object} options - 选项
 * @returns {string} slug
 */
function generateChineseSlug(title, options) {
  // 简化的中文处理：提取关键词或使用拼音首字母
  let slug = title
    .trim()
    .replace(/[^\u4e00-\u9fff\w\s]/g, '') // 只保留中文、字母、数字、空格
    .replace(/\s+/g, '-')
    .toLowerCase();

  // 如果包含数字或英文，保留它们
  const englishParts = title.match(/[a-zA-Z0-9]+/g);
  if (englishParts && englishParts.length > 0) {
    // 组合中文关键词和英文部分
    const englishSlug = englishParts.join('-').toLowerCase();
    const chineseKeywords = extractChineseKeywords(title);
    
    if (chineseKeywords) {
      slug = `${chineseKeywords}-${englishSlug}`;
    } else {
      slug = englishSlug;
    }
  } else {
    // 纯中文的情况，提取关键词
    slug = extractChineseKeywords(title) || 'chinese-article';
  }

  return slug.substring(0, options.maxLength);
}

/**
 * 提取中文关键词（简化版）
 * @param {string} text - 中文文本
 * @returns {string} 关键词slug
 */
function extractChineseKeywords(text) {
  // 简单的关键词提取：取前几个中文字符的拼音首字母（模拟）
  const chineseChars = text.match(/[\u4e00-\u9fff]/g);
  if (!chineseChars || chineseChars.length === 0) {
    return '';
  }

  // 取前6个中文字符，转换为简化表示
  const keywords = chineseChars.slice(0, 6).map(char => {
    // 简化的拼音首字母映射（仅示例，实际应使用完整的拼音库）
    const pinyinMap = {
      '基': 'j', '金': 'j', '经': 'j', '理': 'l', '错': 'c', '失': 's',
      '黄': 'h', '牛': 'n', '暴': 'b', '赚': 'z', '倍': 'b', '造': 'z',
      '富': 'f', '谁': 's', '微': 'w', '信': 'x', '文': 'w', '章': 'z',
      '提': 't', '取': 'q', '内': 'n', '容': 'r', '问': 'w', '题': 't'
    };
    
    return pinyinMap[char] || 'x'; // 默认用'x'代替未知字符
  }).join('');

  return keywords || 'ch'; // 默认为'ch'（chinese）
}

/**
 * 预览Slug（带时间戳）
 * @param {string} title - 标题
 * @param {Object} options - 选项
 * @returns {string} 预览slug
 */
export function generatePreviewSlug(title, options = {}) {
  const baseSlug = generateSlug(title, options);
  const timestamp = Date.now().toString().slice(-4); // 最后4位时间戳
  
  return `${baseSlug}-${timestamp}`;
}

/**
 * 验证Slug格式
 * @param {string} slug - 待验证的slug
 * @returns {boolean} 是否有效
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // 基本格式检查
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug) && slug.length >= 3 && slug.length <= 100;
} 