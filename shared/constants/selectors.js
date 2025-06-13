/**
 * 微信文章选择器常量
 * 统一CLI和扩展中使用的选择器
 */

export const WECHAT_SELECTORS = {
  // 标题选择器（优先级从高到低）
  title: [
    '#activity-name',
    '.rich_media_title',
    'h1[data-role="title"]',
    'h1',
    '.weui-article__h1'
  ],

  // 作者/公众号选择器
  author: [
    '#js_name',
    '.rich_media_meta_text',
    '.account_nickname_inner',
    '.weui-article__author'
  ],

  // 发布时间选择器
  publishTime: [
    '#publish_time',
    'em.rich_media_meta_text',
    '.rich_media_meta_text[id*="time"]',
    '.weui-article__time'
  ],

  // 内容选择器
  content: [
    '#js_content',
    '.rich_media_content',
    '#page-content .rich_media_content',
    '.rich_media_area_primary',
    '.weui-article__bd',
    '.weui-msg',
    '[data-role="content"]',
    '.weui-article'
  ],

  // 摘要/描述选择器
  digest: [
    '.rich_media_meta_text',
    'meta[name="description"]',
    'meta[property="og:description"]',
    '.weui-article__desc'
  ],

  // 图片容器选择器
  imageContainers: [
    '#js_content',
    '.rich_media_content',
    '#page-content',
    '.rich_media_area_primary',
    '.weui-article__bd'
  ]
};

// 清理规则选择器
export const CLEANUP_SELECTORS = {
  // 微信特定的噪音元素
  wechat: [
    '#content_bottom_area',
    '#js_article_comment', 
    '#js_tags',
    '.rich_media_tool',
    '.share_notice',
    '.qr_code_pc',
    '.reward_area',
    '.promotion_area'
  ],

  // 通用噪音元素
  general: [
    'script',
    'style',
    'noscript',
    '.advertisement',
    '.ads',
    '.banner',
    '.sidebar',
    '.footer',
    '.navigation',
    '.nav',
    '.menu',
    '.social-share',
    '.comments',
    '.related-articles'
  ]
};

// 验证页面检测选择器
export const VERIFICATION_SELECTORS = [
  '.weui-msg',
  '[class*="verification"]',
  '[class*="verify"]',
  '.tips_global',
  '.verify_container'
]; 