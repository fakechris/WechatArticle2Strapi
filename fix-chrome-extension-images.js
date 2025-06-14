/**
 * 修复 Chrome Extension 中的 images 字段配置
 * 
 * 使用方法：
 * 1. 打开 Chrome 扩展的开发者工具
 * 2. 在 Console 中粘贴并运行这段代码
 * 3. 刷新扩展设置页面验证
 */

console.log('🔧 开始修复 Chrome Extension images 字段配置...');

// 获取当前配置
chrome.storage.sync.get(null, (data) => {
  console.log('📋 当前配置:', data);
  
  // 检查字段映射配置
  if (!data.fieldMapping) {
    console.warn('⚠️  fieldMapping 配置不存在，创建默认配置');
    data.fieldMapping = {
      enabled: true,
      fields: {}
    };
  }
  
  if (!data.fieldMapping.fields) {
    console.warn('⚠️  fieldMapping.fields 不存在，创建默认配置');
    data.fieldMapping.fields = {};
  }
  
  // 检查 images 字段配置
  const currentImagesField = data.fieldMapping.fields.images;
  console.log(`🖼️  当前 images 字段映射: "${currentImagesField}"`);
  
  if (!currentImagesField || currentImagesField.trim() === '') {
    console.log('🚀 更新 images 字段映射为 "images"');
    
    // 更新配置
    const updatedConfig = {
      ...data,
      fieldMapping: {
        ...data.fieldMapping,
        fields: {
          ...data.fieldMapping.fields,
          images: 'images'  // 设置 images 字段映射
        }
      }
    };
    
    // 保存更新后的配置
    chrome.storage.sync.set(updatedConfig, () => {
      console.log('✅ 配置更新成功！');
      
      // 验证更新
      chrome.storage.sync.get(['fieldMapping'], (newData) => {
        console.log('🔍 验证更新后的配置:');
        console.log('  images 字段映射:', newData.fieldMapping.fields.images);
        
        if (newData.fieldMapping.fields.images === 'images') {
          console.log('🎉 修复成功！images 字段现在正确映射到 "images"');
          console.log('💡 请刷新扩展设置页面或重新测试提取功能');
        } else {
          console.error('❌ 修复失败，请手动配置');
        }
      });
    });
  } else {
    console.log('✅ images 字段已正确配置:', currentImagesField);
  }
});

// 额外的诊断信息
console.log(`
🔍 诊断信息:
===========================================
问题: Chrome Extension 没有 images 列表
原因: fieldMapping.fields.images 为空
解决: 设置为 "images"

预期行为:
1. ✅ CLI: 使用 .articlerc.json → images: "images" 
2. ✅ Extension: 使用 chrome.storage → images: "images"
3. ✅ 共享逻辑: buildStrapiData() 处理 allImageIds

手动修复步骤:
1. 打开扩展设置页面
2. 启用 "Enable custom field mapping"  
3. 找到 "Images" 字段
4. 输入 "images"
5. 保存设置
===========================================
`); 