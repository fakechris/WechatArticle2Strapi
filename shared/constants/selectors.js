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

// 网站特定选择器配置
export const SITE_SPECIFIC_SELECTORS = {
  // 金融八卦女网站
  'jinrongbaguanv.com': {
    title: [
      'title',                 // 页面标题优先
      '#topTitleH5',           // 从DOM截图看到的标题ID
      '.photoNews_title',      // 可能的标题类
      '.article-title',
      '.detail-title', 
      '.news-title',
      '.content-title',
      '.page-title',
      '.main-title',
      '[class*="title"]',      // 任何包含title的class
      'h1',
      'h2',
      '.title'
    ],
    content: [
      '#content',              // 从DOM截图看到的主要内容ID
      '.content_wrap',         // 内容包装类
      '.article-content',
      '.detail-content',
      '.news-content', 
      '.content-main',
      '.article-body',
      '.post-content',
      '[class*="content"]',
      '.main-content',
      'main',
      'article',
      'body'                   // 最后备选整个body
    ],
    author: [
      '.article-author',
      '.author-name',
      '.byline',
      '.writer',
      '.source',               // 可能的来源信息
      '[class*="author"]',
      '[class*="source"]'
    ],
    publishTime: [
      '.publish-time',
      '.article-time',
      '.date',
      '.time',
      '[class*="time"]',
      '[class*="date"]',
      '.publish-date'
    ],
    imageContainers: [
      '#content',              // 主要内容区域
      '.content_wrap',         // 内容包装
      '.article-content',
      '.detail-content', 
      '.news-content',
      '.content-main',
      'main',
      'article',
      'body'                   // 最后备选整个body
    ]
  },

  // 可以继续添加其他网站的选择器
  'example.com': {
    title: ['.title', 'h1'],
    content: ['.content', '.article'],
    author: ['.author'],
    publishTime: ['.date'],
    imageContainers: ['.content']
  }
}; 