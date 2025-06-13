/**
 * 测试统一配置逻辑
 * 验证Chrome Extension和CLI的配置读取逻辑一致性
 */

// 模拟Chrome Extension环境
global.chrome = {
  storage: {
    sync: {
      get: (keys, callback) => {
        // 模拟存储的数据
        const mockData = {
          strapiUrl: 'https://example.strapi.com',
          token: 'test-token-12345',
          collection: 'articles',
          fieldMapping: {
            enabled: true,
            fields: {
              title: 'custom_title',
              content: 'custom_content',
              author: 'custom_author'
            }
          },
          advancedSettings: {
            maxContentLength: 30000,
            generateSlug: true,
            uploadImages: false
          }
        };
        
        setTimeout(() => callback(mockData), 10);
      }
    }
  },
  runtime: {
    lastError: null
  }
};

// 导入CLI配置管理器
import ConfigManager from './cli/src/config.js';

// 模拟Chrome Extension的统一配置逻辑
function loadUnifiedConfig() {
  return new Promise((resolve, reject) => {
    const configKeys = [
      'strapiUrl', 'token', 'collection', 
      'fieldMapping', 'fieldPresets', 'advancedSettings',
      'enableCleanupRules', 'customCleanupRules'
    ];

    chrome.storage.sync.get(configKeys, (data) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const normalizedConfig = normalizeUnifiedConfig(data);
      resolve(normalizedConfig);
    });
  });
}

function getUnifiedDefaultConfig() {
  return {
    strapiUrl: '',
    token: '',
    collection: 'articles',
    fieldMapping: {
      enabled: false,
      fields: {
        title: 'title',
        content: 'content',
        author: 'author',
        publishTime: 'publishTime',
        digest: 'digest',
        sourceUrl: 'sourceUrl',
        images: 'images',
        slug: 'slug',
        siteName: 'siteName',
        language: 'language',
        tags: 'tags',
        readingTime: 'readingTime',
        created: 'extractedAt',
        headImg: 'head_img'
      }
    },
    fieldPresets: {
      enabled: false,
      presets: {}
    },
    advancedSettings: {
      maxContentLength: 50000,
      maxImages: 10,
      generateSlug: true,
      uploadImages: true,
      sanitizeContent: true,
      includeBlocksField: false,
      putContentInBlocks: false,
      blocksComponentName: 'blocks.rich-text',
      enableImageCompression: true,
      imageQuality: 0.8,
      maxImageWidth: 1200,
      maxImageHeight: 800,
      smartImageReplace: true,
      retryFailedImages: true,
      uploadHeadImg: false,
      headImgIndex: 0
    },
    enableCleanupRules: true,
    customCleanupRules: []
  };
}

function normalizeUnifiedConfig(userConfig = {}) {
  const defaultConfig = getUnifiedDefaultConfig();
  return deepMergeUnifiedConfig(defaultConfig, userConfig);
}

function deepMergeUnifiedConfig(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isUnifiedObject(source[key]) && isUnifiedObject(result[key])) {
        result[key] = deepMergeUnifiedConfig(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

function isUnifiedObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

async function testUnifiedConfig() {
  console.log('🧪 测试统一配置逻辑一致性\n');

  try {
    // 1. 测试Chrome Extension配置读取
    console.log('1️⃣ 测试Chrome Extension配置读取...');
    const chromeConfig = await loadUnifiedConfig();
    console.log('Chrome Extension配置:', JSON.stringify(chromeConfig, null, 2));

    // 2. 测试CLI配置读取
    console.log('\n2️⃣ 测试CLI配置读取...');
    const cliConfigManager = new ConfigManager();
    const cliDefaultConfig = cliConfigManager.getDefaultConfig();
    console.log('CLI默认配置:', JSON.stringify(cliDefaultConfig, null, 2));

    // 3. 比较配置结构
    console.log('\n3️⃣ 比较配置结构...');
    
    const chromeDefaultConfig = getUnifiedDefaultConfig();
    const structureMatch = compareConfigStructure(chromeDefaultConfig, cliDefaultConfig);
    
    console.log('配置结构比较结果:');
    console.log('- 基本字段匹配:', structureMatch.basicFields);
    console.log('- 字段映射匹配:', structureMatch.fieldMapping);
    console.log('- 高级设置匹配:', structureMatch.advancedSettings);
    console.log('- 总体匹配度:', structureMatch.overallMatch);

    // 4. 测试字段映射逻辑
    console.log('\n4️⃣ 测试字段映射逻辑...');
    const testArticle = {
      title: '测试文章标题',
      content: '测试文章内容',
      author: '测试作者',
      url: 'https://example.com/article'
    };

    const chromeData = buildUnifiedStrapiData(testArticle, chromeConfig);
    console.log('Chrome Extension构建的数据:', chromeData);

    // 5. 验证结果
    console.log('\n✅ 测试完成');
    console.log('统一配置逻辑验证:', structureMatch.overallMatch ? '通过' : '失败');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

function compareConfigStructure(chromeConfig, cliConfig) {
  const results = {
    basicFields: true,
    fieldMapping: true,
    advancedSettings: true,
    overallMatch: true
  };

  // 比较基本字段
  const basicFields = ['strapiUrl', 'token', 'collection'];
  for (const field of basicFields) {
    if ((field in chromeConfig) !== (field in cliConfig)) {
      results.basicFields = false;
      console.log(`❌ 基本字段不匹配: ${field}`);
    }
  }

  // 比较字段映射结构
  if (chromeConfig.fieldMapping && cliConfig.fieldMapping) {
    const chromeFields = Object.keys(chromeConfig.fieldMapping.fields || {});
    const cliFields = Object.keys(cliConfig.fieldMapping.fields || {});
    
    const fieldsDiff = chromeFields.filter(f => !cliFields.includes(f))
      .concat(cliFields.filter(f => !chromeFields.includes(f)));
    
    if (fieldsDiff.length > 0) {
      results.fieldMapping = false;
      console.log(`❌ 字段映射不匹配: ${fieldsDiff.join(', ')}`);
    }
  }

  // 比较高级设置结构
  if (chromeConfig.advancedSettings && cliConfig.advancedSettings) {
    const chromeAdvanced = Object.keys(chromeConfig.advancedSettings || {});
    const cliAdvanced = Object.keys(cliConfig.advancedSettings || {});
    
    const advancedDiff = chromeAdvanced.filter(f => !cliAdvanced.includes(f))
      .concat(cliAdvanced.filter(f => !chromeAdvanced.includes(f)));
    
    if (advancedDiff.length > 0) {
      results.advancedSettings = false;
      console.log(`❌ 高级设置不匹配: ${advancedDiff.join(', ')}`);
    }
  }

  results.overallMatch = results.basicFields && results.fieldMapping && results.advancedSettings;
  return results;
}

function buildUnifiedStrapiData(article, config) {
  const fieldMapping = config.fieldMapping || { enabled: false, fields: {} };
  const fieldMap = fieldMapping.enabled ? fieldMapping.fields : {
    title: 'title',
    content: 'content',
    author: 'author'
  };
  
  const data = {};
  
  if (fieldMap.title && article.title) {
    data[fieldMap.title] = article.title;
  }
  
  if (fieldMap.content && article.content) {
    data[fieldMap.content] = article.content;
  }
  
  if (fieldMap.author && article.author) {
    data[fieldMap.author] = article.author;
  }
  
  return data;
}

// 运行测试
testUnifiedConfig().then(() => {
  console.log('\n🎉 所有测试完成');
}).catch(error => {
  console.error('💥 测试失败:', error);
}); 