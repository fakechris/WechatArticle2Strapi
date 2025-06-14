# 头图尺寸检查功能修复总结

## ❌ 问题发现

用户在使用cli_v2时发现以下问题：

```
[StrapiIntegration] Node.js环境暂不支持图片尺寸检查 
[StrapiIntegration] 图片尺寸检查: xxx { width: 0, height: 0, minWidth: 200, minHeight: 200, isValid: false }
```

## 🔍 问题分析

在 `shared/core/integrations/strapi-integration.js` 中，`getImageDimensions` 方法在Node.js环境中没有正确实现，导致：

1. **总是返回 `{width: 0, height: 0}`**
2. **所有图片都被判定为不符合尺寸要求**
3. **头图功能完全失效**

## ✅ 修复方案

### 1. 修改了 `getImageDimensions` 方法

**修改前：**
```javascript
// 在Node.js环境中，可以使用其他方法获取图片尺寸
// 这里先返回默认值，实际实现时可以使用image-size等库
this.log('Node.js环境暂不支持图片尺寸检查');
return {
  width: 0,
  height: 0,
  aspectRatio: 1
};
```

**修改后：**
```javascript
// 在Node.js环境中使用image-size包获取图片尺寸
try {
  // 动态导入所需模块（只在Node.js环境中可用）
  const axios = await this.importAxios();
  
  // 检查是否为Node.js环境
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // 动态require image-size（避免webpack打包）
    const sizeOf = eval('require')('image-size');
    
    const response = await axios.default({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      },
      timeout: 10000
    });
    
    const dimensions = sizeOf(Buffer.from(response.data));
    
    return {
      width: dimensions.width,
      height: dimensions.height,
      aspectRatio: dimensions.width / dimensions.height
    };
  } else {
    throw new Error('Not in Node.js environment');
  }
} catch (error) {
  this.log(`无法获取图片尺寸: ${error.message}`);
  // 如果获取失败，返回默认值
  return {
    width: 0,
    height: 0,
    aspectRatio: 1
  };
}
```

### 2. 添加依赖

- 在主项目中安装了 `image-size` 包
- 在CLI项目中也安装了 `image-size` 包

### 3. 避免Webpack打包冲突

- 使用 `eval('require')` 来动态导入，避免webpack将browser环境不兼容的模块打包
- 添加环境检查确保只在Node.js环境中使用

## 🎯 修复后效果

现在 cli_v2 应该能够：

1. ✅ **正确获取图片实际尺寸**
2. ✅ **准确判断图片是否符合200x200的最小要求**
3. ✅ **自动选择第一张符合要求的图片作为头图**
4. ✅ **向后兼容原有的索引指定功能**

## 📊 预期日志输出

修复后的日志应该类似这样：

```
[StrapiIntegration] 查找符合尺寸要求的头图 (最小: 200x200) 
[StrapiIntegration] 检查指定的头图索引 0... 
[StrapiIntegration] 图片尺寸检查: https://example.com/small.jpg... { 
  width: 100, height: 80, minWidth: 200, minHeight: 200, isValid: false 
}
[StrapiIntegration] 指定索引的图片不符合尺寸要求，将搜索其他图片... 
[StrapiIntegration] 检查第 2 张图片... 
[StrapiIntegration] 图片尺寸检查: https://example.com/large.jpg... { 
  width: 800, height: 600, minWidth: 200, minHeight: 200, isValid: true 
}
[StrapiIntegration] 找到符合要求的头图: 索引 1, 尺寸 800x600
[StrapiIntegration] 选择第 2 张图片作为头图，尺寸: 800x600
```

## 🧪 验证方法

1. **运行 cli_v2 命令**：
   ```bash
   cd cli
   node bin/cli_v2.js "https://your-article-url" \
     --strapi \
     --head-image \
     --verbose
   ```

2. **检查日志输出**：
   - 应该显示实际的图片尺寸（不再是0x0）
   - 应该能正确选择符合要求的头图

## 📁 修改的文件

- `shared/core/integrations/strapi-integration.js` - 主要修复
- `package.json` - 添加image-size依赖
- `cli/package.json` - 添加image-size依赖

---

**修复完成日期：** 2024年最新  
**影响范围：** CLI工具 (cli_v2) 和Chrome扩展的共享核心模块 