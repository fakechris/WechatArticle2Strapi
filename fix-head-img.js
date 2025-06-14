// 修复头图配置问题的脚本
console.log('🔧 检查和修复头图配置问题...');

// 检查Chrome存储中的配置
chrome.storage.sync.get(['advancedSettings'], (result) => {
  console.log('当前高级设置:', result.advancedSettings);
  
  const currentSettings = result.advancedSettings || {};
  
  // 检查头图上传是否启用
  if (!currentSettings.uploadHeadImg) {
    console.log('❌ 头图上传未启用，正在启用...');
    
    // 启用头图上传
    const updatedSettings = {
      ...currentSettings,
      uploadHeadImg: true,
      headImgIndex: 0, // 使用第一张图片作为头图
      uploadImages: true, // 也启用图片上传
      maxImages: 10,
      enableImageCompression: true,
      imageQuality: 0.8,
      maxImageWidth: 1200,
      maxImageHeight: 800
    };
    
    chrome.storage.sync.set({ advancedSettings: updatedSettings }, () => {
      console.log('✅ 头图上传已启用！');
      console.log('新的高级设置:', updatedSettings);
      
      // 同时检查字段映射
      chrome.storage.sync.get(['fieldMapping'], (mappingResult) => {
        console.log('字段映射设置:', mappingResult.fieldMapping);
        
        if (mappingResult.fieldMapping && mappingResult.fieldMapping.enabled) {
          const headImgField = mappingResult.fieldMapping.fields.headImg;
          console.log('头图字段映射:', headImgField);
          
          if (headImgField === 'head_img') {
            console.log('✅ 头图字段映射正确');
          } else {
            console.log('❌ 头图字段映射可能有问题');
          }
        }
      });
    });
  } else {
    console.log('✅ 头图上传已启用');
    console.log('当前配置:', {
      uploadHeadImg: currentSettings.uploadHeadImg,
      headImgIndex: currentSettings.headImgIndex,
      uploadImages: currentSettings.uploadImages
    });
  }
});

// 测试头图处理逻辑
function testHeadImgLogic() {
  console.log('🧪 测试头图处理逻辑...');
  
  // 模拟文章数据
  const mockArticle = {
    title: '测试文章',
    content: '测试内容',
    images: [
      { src: 'https://example.com/image1.jpg', alt: '测试图片1' },
      { src: 'https://example.com/image2.jpg', alt: '测试图片2' }
    ]
  };
  
  console.log('模拟文章数据:', mockArticle);
  console.log('图片数量:', mockArticle.images.length);
  console.log('第一张图片（将作为头图）:', mockArticle.images[0]);
}

// 运行测试
testHeadImgLogic(); 