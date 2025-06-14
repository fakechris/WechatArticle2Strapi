/**
 * Slug生成工具函数
 * 支持Node.js和浏览器环境，使用limax库进行中文转拼音slug生成
 */

import { slugify } from 'transliteration';

/**
 * 生成URL友好的slug
 * @param {string} text - 要转换的文本
 * @returns {string} - 生成的slug
 */
export function generateSlug(text) {
  if (!text || typeof text !== 'string') {
    console.warn('[SLUG-DEBUG] Invalid input:', text);
    return 'untitled';
  }

  try {
    // 使用 transliteration 库进行转换
    // 它支持中文转拼音，并且同时支持 ES modules 和 CommonJS
    const slug = slugify(text, {
      lowercase: true,
      separator: '-',
      trim: true
    });
    
    console.log(`[SLUG-DEBUG] "${text}" → "${slug}"`);
    return slug || 'untitled';
  } catch (error) {
    console.error('[SLUG-ERROR] transliteration failed:', error);
    // 简单的后备方案
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled';
  }
}

/**
 * 回退的Slug生成实现（适用于Chrome Extension等浏览器环境）
 * @param {string} title - 标题
 * @param {Object} options - 选项
 * @returns {string} slug
 */
function generateSlugFallback(title, options) {
  // 简化的中文转拼音映射（针对常用词汇）
  const pinyinMap = {
    // 常用科技词汇
    '微': 'wei', '信': 'xin', '公': 'gong', '众': 'zhong', '号': 'hao',
    '文': 'wen', '章': 'zhang', '提': 'ti', '取': 'qu', '内': 'nei', '容': 'rong',
    '技': 'ji', '术': 'shu', '人': 'ren', '工': 'gong', '智': 'zhi', '能': 'neng',
    '数': 'shu', '据': 'ju', '分': 'fen', '析': 'xi', '系': 'xi', '统': 'tong',
    '开': 'kai', '发': 'fa', '程': 'cheng', '序': 'xu', '网': 'wang', '站': 'zhan',
    '应': 'ying', '用': 'yong', '软': 'ruan', '件': 'jian', '服': 'fu', '务': 'wu',
    '前': 'qian', '端': 'duan', '后': 'hou', '库': 'ku', '框': 'kuang', '架': 'jia',
    
    // 常用字
    '的': 'de', '是': 'shi', '在': 'zai', '有': 'you', '和': 'he', '与': 'yu',
    '来': 'lai', '去': 'qu', '上': 'shang', '下': 'xia', '会': 'hui', '可': 'ke',
    '以': 'yi', '要': 'yao', '说': 'shuo', '看': 'kan', '做': 'zuo', '想': 'xiang',
    '大': 'da', '小': 'xiao', '新': 'xin', '老': 'lao', '好': 'hao',
    '中': 'zhong', '国': 'guo', '年': 'nian', '月': 'yue', '日': 'ri',
    
    // 数字
    '一': 'yi', '二': 'er', '三': 'san', '四': 'si', '五': 'wu',
    '六': 'liu', '七': 'qi', '八': 'ba', '九': 'jiu', '十': 'shi',
    '零': 'ling', '百': 'bai', '千': 'qian', '万': 'wan'
  };

  let slug = title.trim();

  // 转换中文字符为拼音
  slug = slug.replace(/[\u4e00-\u9fff]/g, char => pinyinMap[char] || 'ch');

  // 基本清理
  slug = slug
    // 移除HTML标签
    .replace(/<[^>]*>/g, '')
    // 替换中文标点符号
    .replace(/[，。！？；：""''（）【】《》、]/g, '')
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
 * 异步版本的slug生成（用于动态导入环境）
 * @param {string} title - 文章标题
 * @param {Object} options - 配置选项
 * @returns {Promise<string>} 生成的slug
 */
export async function generateSlugAsync(title, options = {}) {
  if (!title || typeof title !== 'string') {
    return '';
  }

  const defaultOptions = {
    replacement: '-',
    maxLength: 60,
    tone: false,
    ...options
  };

  try {
    // 初始化limax库
    await initializeLimax();

    if (limaxAvailable && limax) {
      const slug = limax(title, {
        tone: defaultOptions.tone,
        replacement: defaultOptions.replacement,
        lowercase: true,
        separator: defaultOptions.replacement
      });
      
      return slug.substring(0, defaultOptions.maxLength);
    }

    return generateSlugFallback(title, defaultOptions);
  } catch (error) {
    console.warn('异步Slug生成失败，使用回退方案:', error);
    return generateSlugFallback(title, defaultOptions);
  }
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

  // 基本格式检查：只允许小写字母、数字、连字符
  const slugPattern = /^[a-z0-9-]+$/;
  
  return slugPattern.test(slug) && 
         slug.length > 0 && 
         slug.length <= 100 &&
         !slug.startsWith('-') && 
         !slug.endsWith('-') &&
         !slug.includes('--'); // 不允许连续的连字符
}

/**
 * 检查当前环境是否支持limax库
 * @returns {boolean} 是否支持limax
 */
export function isLimaxAvailable() {
  return limaxAvailable;
} 