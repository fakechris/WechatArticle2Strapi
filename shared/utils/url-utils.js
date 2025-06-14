/**
 * URL相关工具函数
 * 统一CLI和扩展中的URL处理逻辑
 */

/**
 * 验证图片URL是否有效
 * @param {string} url - 图片URL
 * @returns {boolean} 是否有效
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // 去除空白字符
  url = url.trim();

  // 基本URL格式检查，包括协议相对URL（// 开头）
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
    return false;
  }

  // 微信图片域名检查
  const wechatImageDomains = [
    'mmbiz.qpic.cn',
    'mmbiz.qlogo.cn',
    'wx.qlogo.cn'
  ];

  const isWeChatImage = wechatImageDomains.some(domain => url.includes(domain));
  
  // 图片格式检查
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const hasImageExtension = imageExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );

  // 微信图片特殊格式检查（通常包含wx_fmt参数）
  const hasWeChatFormat = url.includes('wx_fmt=') || url.includes('tp=webp');

  // 过滤掉明显的非图片URL
  const excludePatterns = [
    'javascript:',
    'data:text/',
    'chrome-extension://',
    'moz-extension://',
    'extension://'
  ];

  const isExcluded = excludePatterns.some(pattern => url.includes(pattern));

  if (isExcluded) {
    return false;
  }

  // 微信图片或有图片扩展名的URL都认为有效
  return isWeChatImage || hasImageExtension || hasWeChatFormat;
}

/**
 * 标准化URL（处理相对路径等）
 * @param {string} url - 原始URL
 * @param {string} baseUrl - 基础URL
 * @returns {string} 标准化后的URL
 */
export function normalizeUrl(url, baseUrl) {
  if (!url) return '';

  // 已经是完整URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 协议相对URL
  if (url.startsWith('//')) {
    const protocol = baseUrl ? new URL(baseUrl).protocol : 'https:';
    return `${protocol}${url}`;
  }

  // 相对路径
  if (baseUrl) {
    try {
      return new URL(url, baseUrl).href;
    } catch (error) {
      console.warn('URL标准化失败:', url, error);
      return url;
    }
  }

  return url;
}

/**
 * 提取域名
 * @param {string} url - URL字符串
 * @returns {string} 域名
 */
export function extractDomain(url) {
  if (!url) return '';

  try {
    return new URL(url).hostname;
  } catch (error) {
    // 简单的域名提取回退方案
    const match = url.match(/^(?:https?:\/\/)?([^\/]+)/);
    return match ? match[1] : '';
  }
}

/**
 * 检查是否为微信文章URL
 * @param {string} url - URL字符串
 * @returns {boolean} 是否为微信文章
 */
export function isWeChatArticleUrl(url) {
  if (!url) return false;
  
  const wechatDomains = [
    'mp.weixin.qq.com',
    'weixin.qq.com'
  ];

  return wechatDomains.some(domain => url.includes(domain));
}

/**
 * 清理URL参数（移除追踪参数等）
 * @param {string} url - 原始URL
 * @returns {string} 清理后的URL
 */
export function cleanUrl(url) {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    
    // 需要保留的重要参数
    const keepParams = [
      'poc_token',  // 微信访问token
      'chksm',      // 微信校验参数
      'scene',      // 微信场景参数
      'srcid',      // 来源ID
      'from',       // 来源标识
      'isappinstalled' // 应用安装状态
    ];

    // 移除非必要参数
    const paramsToRemove = [];
    for (const [key] of urlObj.searchParams) {
      if (!keepParams.includes(key)) {
        paramsToRemove.push(key);
      }
    }

    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.href;
  } catch (error) {
    console.warn('URL清理失败:', url, error);
    return url;
  }
} 