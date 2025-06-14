// 在Chrome扩展Console中运行这个脚本来调试头图配置和处理过程
console.log('🔍 开始调试头图配置和处理过程...');

// 1. 检查当前配置
chrome.storage.sync.get(['advancedSettings', 'fieldMapping'], (result) => {
  console.log('===== 配置检查 =====');
  console.log('高级设置:', result.advancedSettings);
  console.log('字段映射:', result.fieldMapping);
  
  const settings = result.advancedSettings || {};
  const mapping = result.fieldMapping || {};
  
  console.log('===== 头图相关配置 =====');
  console.log('头图上传启用:', settings.uploadHeadImg);
  console.log('头图索引:', settings.headImgIndex);
  console.log('图片上传启用:', settings.uploadImages);
  console.log('最大图片数:', settings.maxImages);
  
  if (mapping.enabled && mapping.fields) {
    console.log('头图字段映射:', mapping.fields.headImg);
  }
  
  // 2. 如果头图上传未启用，自动启用
  if (!settings.uploadHeadImg) {
    console.log('❌ 头图上传未启用，正在自动启用...');
    
    const newSettings = {
      ...settings,
      uploadHeadImg: true,
      headImgIndex: 0,
      uploadImages: true,
      maxImages: 10
    };
    
    chrome.storage.sync.set({ advancedSettings: newSettings }, () => {
      console.log('✅ 头图上传已自动启用！');
      console.log('新配置:', newSettings);
      console.log('🔄 请重新加载扩展页面并重试提取');
    });
  } else {
    console.log('✅ 头图上传已启用');
    
    // 3. 如果已启用，检查字段映射
    if (mapping.enabled && mapping.fields && mapping.fields.headImg) {
      console.log('✅ 头图字段映射正确:', mapping.fields.headImg);
    } else {
      console.log('⚠️ 字段映射可能有问题');
    }
  }
});

// 4. 监听扩展消息，查看头图处理日志
console.log('===== 监听处理日志 =====');
console.log('请现在尝试提取文章，观察以下日志输出...');

// 添加消息监听来查看处理过程
if (typeof originalConsoleLog === 'undefined') {
  window.originalConsoleLog = console.log;
  console.log = function(...args) {
    // 过滤头图相关日志
    const message = args.join(' ');
    if (message.includes('头图') || message.includes('headImg') || message.includes('head_img') || message.includes('HeadImage')) {
      window.originalConsoleLog('🖼️ [HEAD_IMG]', ...args);
    } else {
      window.originalConsoleLog(...args);
    }
  };
}

console.log('🎯 头图调试脚本运行完成，请尝试提取文章并观察日志'); 