class CleanupRules {
  constructor() {
    this.rules = [
      // WeChat specific cleanup rules
      { type: 'id', value: 'content_bottom_area', description: '微信底部推荐区域', domains: ['mp.weixin.qq.com'] },
      { type: 'id', value: 'js_article_comment', description: '微信评论区域', domains: ['mp.weixin.qq.com'] },
      { type: 'id', value: 'js_tags', description: '微信标签区域', domains: ['mp.weixin.qq.com'] },
      { type: 'class', value: 'rich_media_tool', description: '微信工具栏', domains: ['mp.weixin.qq.com'] },
      { type: 'class', value: 'share_notice', description: '微信分享提示', domains: ['mp.weixin.qq.com'] },
      { type: 'class', value: 'qr_code_pc', description: '微信二维码', domains: ['mp.weixin.qq.com'] },
      { type: 'class', value: 'reward_area', description: '微信打赏区域', domains: ['mp.weixin.qq.com'] },
      { type: 'class', value: 'promotion_area', description: '推广区域', domains: ['mp.weixin.qq.com'] },
      
      // Zhihu specific rules
      { type: 'class', value: 'RichContent-actions', description: '知乎操作栏', domains: ['zhuanlan.zhihu.com', 'www.zhihu.com'] },
      { type: 'class', value: 'ContentItem-actions', description: '知乎内容操作', domains: ['zhuanlan.zhihu.com', 'www.zhihu.com'] },
      { type: 'class', value: 'Recommendations-Main', description: '知乎推荐', domains: ['zhuanlan.zhihu.com', 'www.zhihu.com'] },
      
      // Jianshu specific rules
      { type: 'class', value: 'follow-detail', description: '简书关注详情', domains: ['www.jianshu.com'] },
      { type: 'class', value: 'recommendation', description: '简书推荐', domains: ['www.jianshu.com'] },
      
      // CSDN specific rules
      { type: 'class', value: 'tool-box', description: 'CSDN工具箱', domains: ['blog.csdn.net'] },
      { type: 'class', value: 'recommend-box', description: 'CSDN推荐', domains: ['blog.csdn.net'] },
      
      // Universal noise cleanup
      { type: 'class', value: 'advertisement', description: '广告区域' },
      { type: 'class', value: 'ads', description: '广告' },
      { type: 'class', value: 'banner', description: '横幅广告' },
      { type: 'class', value: 'sidebar', description: '侧边栏' },
      { type: 'class', value: 'footer', description: '页脚' },
      { type: 'class', value: 'navigation', description: '导航栏' },
      { type: 'class', value: 'nav', description: '导航' },
      { type: 'class', value: 'menu', description: '菜单' },
      { type: 'class', value: 'social-share', description: '社交分享' },
      { type: 'class', value: 'comments', description: '评论区' },
      { type: 'class', value: 'related-articles', description: '相关文章' },
      
      // Remove script and style tags
      { type: 'tag', value: 'script', description: '脚本标签' },
      { type: 'tag', value: 'style', description: '样式标签' },
      { type: 'tag', value: 'noscript', description: 'NoScript标签' }
    ];
  }

  apply(document, url) {
    const hostname = new URL(url).hostname;
    let removedCount = 0;
    let appliedRules = 0;
    let skippedRules = 0;

    for (const rule of this.rules) {
      try {
        // Check domain matching
        if (!this.isDomainMatched(rule, hostname)) {
          skippedRules++;
          continue;
        }

        appliedRules++;
        const elements = this.findElements(document, rule);

        if (elements.length > 0) {
          elements.forEach(element => {
            element.remove();
            removedCount++;
          });
        }
      } catch (error) {
        console.warn(`Error applying cleanup rule ${rule.type}:${rule.value}:`, error.message);
      }
    }

    return removedCount;
  }

  isDomainMatched(rule, hostname) {
    // If rule has no domain restrictions, apply to all
    if (!rule.domains || rule.domains.length === 0) {
      return true;
    }

    // Check if hostname matches any specified domain
    return rule.domains.some(domain => {
      // Exact match
      if (hostname === domain) {
        return true;
      }
      // Wildcard support (*.example.com)
      if (domain.startsWith('*.')) {
        const baseDomain = domain.substring(2);
        return hostname.endsWith('.' + baseDomain) || hostname === baseDomain;
      }
      return false;
    });
  }

  findElements(document, rule) {
    switch (rule.type) {
      case 'id':
        const elementById = document.getElementById(rule.value);
        return elementById ? [elementById] : [];

      case 'class':
        return Array.from(document.getElementsByClassName(rule.value));

      case 'tag':
        return Array.from(document.getElementsByTagName(rule.value));

      case 'selector':
        return Array.from(document.querySelectorAll(rule.value));

      case 'regex-class':
        const allElements = document.querySelectorAll('[class]');
        const regex = new RegExp(rule.value, 'i');
        return Array.from(allElements).filter(el => 
          Array.from(el.classList).some(className => regex.test(className))
        );

      default:
        return [];
    }
  }

  addCustomRule(rule) {
    // Validate rule structure
    if (!rule.type || !rule.value) {
      throw new Error('Invalid rule: type and value are required');
    }

    const validTypes = ['id', 'class', 'tag', 'selector', 'regex-class'];
    if (!validTypes.includes(rule.type)) {
      throw new Error(`Invalid rule type: ${rule.type}. Valid types: ${validTypes.join(', ')}`);
    }

    this.rules.push({
      description: rule.description || `Custom ${rule.type} rule`,
      ...rule
    });
  }

  removeRule(predicate) {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => !predicate(rule));
    return initialLength - this.rules.length;
  }

  getRules(domain = null) {
    if (!domain) {
      return this.rules;
    }

    return this.rules.filter(rule => this.isDomainMatched(rule, domain));
  }
}

export default CleanupRules;