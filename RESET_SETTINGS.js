// 临时脚本：重置扩展设置
// 在浏览器控制台中运行这段代码来清除可能有问题的设置

chrome.storage.sync.clear(() => {
  console.log('All extension settings cleared');
  
  // 设置正确的默认值
  const defaultSettings = {
    strapiUrl: '',
    token: '',
    collection: 'articles',
    fieldMapping: {
      enabled: false,
      fields: {
        title: 'title',
        content: 'content',
        author: '',
        publishTime: '',
        digest: '',
        sourceUrl: '',
        images: '',
        slug: ''
      }
    },
    advancedSettings: {
      maxContentLength: 50000,
      maxImages: 10,
      generateSlug: true,
      uploadImages: false,  // 默认禁用图片上传
      sanitizeContent: true
    }
  };
  
  chrome.storage.sync.set(defaultSettings, () => {
    console.log('Default settings restored');
    console.log('Please configure your Strapi connection and field mapping again');
  });
}); 