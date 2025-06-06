// 演示规则引擎功能
console.log('🚀 规则引擎演示开始');

// 复制规则引擎代码（来自content-bundled.js）
const DEFAULT_CLEANUP_RULES = [
  // 微信特定的清理规则（只在微信域名生效）
  { type: 'id', value: 'content_bottom_area', description: '微信底部推荐区域', domains: ['mp.weixin.qq.com'] },
  { type: 'id', value: 'js_article_comment', description: '微信评论区域', domains: ['mp.weixin.qq.com'] },
  { type: 'id', value: 'js_tags', description: '微信标签区域', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'rich_media_tool', description: '微信工具栏', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'share_notice', description: '微信分享提示', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'qr_code_pc', description: '微信二维码', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'reward_area', description: '微信打赏区域', domains: ['mp.weixin.qq.com'] },
  { type: 'class', value: 'promotion_area', description: '推广区域', domains: ['mp.weixin.qq.com'] },
  
  // 通用广告和噪音清理
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
  
  // 标签级别清理
  { type: 'tag', value: 'script', description: '脚本标签' },
  { type: 'tag', value: 'style', description: '样式标签' },
  { type: 'tag', value: 'noscript', description: 'NoScript标签' }
];

// 检查域名是否匹配规则
function isDomainMatched(rule, currentHostname) {
  // 如果规则没有指定domains，则适用于所有域名
  if (!rule.domains || !Array.isArray(rule.domains) || rule.domains.length === 0) {
    return true;
  }
  
  // 检查当前hostname是否匹配任何指定域名
  return rule.domains.some(domain => {
    // 精确匹配
    if (currentHostname === domain) {
      return true;
    }
    // 支持通配符匹配（例如: *.zhihu.com）
    if (domain.startsWith('*.')) {
      const baseDomain = domain.substring(2);
      return currentHostname.endsWith('.' + baseDomain) || currentHostname === baseDomain;
    }
    return false;
  });
}

// 应用DOM清理规则
function applyCleanupRules(targetDocument, rules = DEFAULT_CLEANUP_RULES) {
  const currentHostname = window.location.hostname;
  console.log('🧹 Applying DOM cleanup rules:', rules.length, 'for domain:', currentHostname);
  
  let removedCount = 0;
  let appliedRules = 0;
  let skippedRules = 0;
  
  rules.forEach(rule => {
    try {
      // 检查域名匹配
      if (!isDomainMatched(rule, currentHostname)) {
        skippedRules++;
        console.log(`⏭️ Skipping rule for different domain: ${rule.description} (domains: ${rule.domains?.join(', ') || 'all'})`);
        return;
      }
      
      appliedRules++;
      let elements = [];
      
      switch (rule.type) {
        case 'id':
          const elementById = targetDocument.getElementById(rule.value);
          if (elementById) elements = [elementById];
          break;
          
        case 'class':
          elements = Array.from(targetDocument.getElementsByClassName(rule.value));
          break;
          
        case 'tag':
          elements = Array.from(targetDocument.getElementsByTagName(rule.value));
          break;
          
        case 'selector':
          elements = Array.from(targetDocument.querySelectorAll(rule.value));
          break;
          
        case 'regex-class':
          // 通过正则表达式匹配class名
          const allElements = targetDocument.querySelectorAll('[class]');
          const regex = new RegExp(rule.value, 'i');
          elements = Array.from(allElements).filter(el => 
            Array.from(el.classList).some(className => regex.test(className))
          );
          break;
      }
      
      if (elements.length > 0) {
        const domainInfo = rule.domains ? ` [${rule.domains.join(', ')}]` : ' [all domains]';
        console.log(`🗑️ Removing ${elements.length} elements for rule: ${rule.description} (${rule.type}: ${rule.value})${domainInfo}`);
        elements.forEach(element => {
          element.remove();
          removedCount++;
        });
      }
    } catch (error) {
      console.warn(`❌ Error applying cleanup rule ${rule.type}:${rule.value}:`, error);
    }
  });
  
  console.log(`✅ DOM cleanup completed for ${currentHostname}:`);
  console.log(`   📊 Applied rules: ${appliedRules}`);
  console.log(`   ⏭️ Skipped rules: ${skippedRules}`);
  console.log(`   🗑️ Removed elements: ${removedCount}`);
  return removedCount;
}

// 演示功能
function demoRulesEngine() {
  console.log('📊 演示前的DOM统计:');
  console.log('- 总元素数:', document.querySelectorAll('*').length);
  console.log('- 广告元素:', document.querySelectorAll('.advertisement, .ads, .banner').length);
  console.log('- 导航元素:', document.querySelectorAll('.navigation, .nav, .menu').length);
  console.log('- 脚本标签:', document.querySelectorAll('script').length);
  console.log('- 样式标签:', document.querySelectorAll('style').length);
  console.log('- 特定ID (content_bottom_area):', document.getElementById('content_bottom_area') ? 1 : 0);
  
  console.log('\n🔧 开始应用清理规则...');
  const removedCount = applyCleanupRules(document);
  
  console.log('\n📊 清理后的DOM统计:');
  console.log('- 总元素数:', document.querySelectorAll('*').length);
  console.log('- 广告元素:', document.querySelectorAll('.advertisement, .ads, .banner').length);
  console.log('- 导航元素:', document.querySelectorAll('.navigation, .nav, .menu').length);
  console.log('- 脚本标签:', document.querySelectorAll('script').length);
  console.log('- 样式标签:', document.querySelectorAll('style').length);
  console.log('- 特定ID (content_bottom_area):', document.getElementById('content_bottom_area') ? 1 : 0);
  
  console.log(`\n🎯 清理完成！总共删除了 ${removedCount} 个噪音元素`);
  
  // 显示剩余的主要内容
  const mainContent = document.querySelector('main');
  if (mainContent) {
    console.log('\n📄 剩余的主要内容:');
    console.log('- 标题:', document.querySelector('h1')?.textContent || '未找到');
    console.log('- 段落数:', mainContent.querySelectorAll('p').length);
    console.log('- 图片数:', mainContent.querySelectorAll('img').length);
    console.log('- 内容长度:', mainContent.textContent.length);
  }
}

// 提供给控制台使用的函数
window.demoRulesEngine = demoRulesEngine;
window.applyCleanupRules = applyCleanupRules;
window.DEFAULT_CLEANUP_RULES = DEFAULT_CLEANUP_RULES;

console.log('🎭 规则引擎演示已加载！');
console.log('💡 在控制台中运行 demoRulesEngine() 来查看效果'); 