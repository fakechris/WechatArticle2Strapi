# 🚀 Enhanced Article Extractor - Quick Start Guide

## 概述

Enhanced Article Extractor 是一个强大的 Chrome 扩展程序，能够从网页中提取丰富的元数据并保存到 Strapi CMS。该扩展受 Obsidian Clipper 启发，提供了专业级的内容提取和元数据收集功能。

## ⚡ 快速开始

### 1. 安装扩展

1. 下载项目代码
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹

### 2. 配置 Strapi 连接

打开扩展选项页面（右键扩展图标 → 选项）：

```
📡 Strapi Connection
├── Strapi URL: https://your-strapi.com
├── Collection: articles  
└── API Token: your-api-token
```

### 3. 配置字段映射（推荐使用增强模式）

启用 "Enable custom field mapping" 并配置：

#### 基础字段
```
Title → title
Content → description  
Author → author
Slug → slug
```

#### 增强元数据字段
```
Site Name → siteName      // 网站名称
Language → language       // 内容语言
Tags/Keywords → tags      // 关键词标签
Reading Time → readingTime // 阅读时间
Created At → extractedAt  // 提取时间戳
```

#### 🖼️ 头图配置 (v0.3.0 NEW!)
```
Head Image → head_img     // 头图/封面图字段
```

然后在 "⚙️ Advanced Settings" 中：
- ✅ 启用 "自动上传文章头图"
- 设置 "头图选择索引" (0=第1张图片)

### 4. 开始提取文章

1. 打开任意网页（如微信文章）
2. 点击扩展图标
3. 点击 "Preview" 查看提取结果
4. 点击 "Extract & Send" 保存到 Strapi

## 🎯 支持的网站类型

### 优化支持
- ✅ **微信公众号**: 完整元数据提取
- ✅ **知乎专栏**: 作者、标签优化
- ✅ **简书**: 增强作者检测
- ✅ **CSDN**: 技术内容优化
- ✅ **通用网页**: 智能元数据提取

### 提取质量指标
- 🎯 **Defuddle + WeChat**: 最高质量（微信文章）
- ✨ **Defuddle Enhanced**: 高质量（通用网页）
- 📱 **WeChat Selectors**: 微信备用模式
- ⚠️ **Basic Extraction**: 基础备用模式

## 📊 提取的元数据类型

### 核心内容
- **Title**: 文章标题（多源检测）
- **Content**: 正文内容（智能清理）
- **Author**: 作者信息（综合检测）
- **Published**: 发布时间（智能解析）
- **Description**: 文章摘要
- **Images**: 图片资源

### 增强元数据 (受 Obsidian Clipper 启发)
- **Site Name**: 平台名称 (如 "微信公众号")
- **Language**: 内容语言 (如 "zh-CN")
- **Tags**: 关键词标签数组
- **Reading Time**: 预估阅读时间（分钟）
- **Canonical URL**: 规范化URL
- **Created At**: 提取时间戳

## 🔧 Strapi 集合配置示例

### 推荐的字段结构

```javascript
// 增强版 Article 集合
{
  // 核心字段
  title: 'text',              // 文章标题
  description: 'richtext',    // 文章内容
  slug: 'uid',               // URL 标识符
  
  // 基础元数据
  author: 'text',            // 作者姓名
  publishTime: 'text',       // 发布时间
  sourceUrl: 'text',         // 原始链接
  
  // 🖼️ 头图字段 (v0.3.0 NEW!)
  head_img: 'media',         // 头图/封面图 (单个媒体文件)
  
  // 增强元数据
  siteName: 'text',          // 网站名称
  language: 'text',          // 内容语言
  tags: 'json',             // 标签数组
  readingTime: 'integer',    // 阅读时间
  extractedAt: 'datetime',   // 提取时间
  
  // 可选字段
  cover: 'media',           // 封面图片
  category: 'relation'      // 分类关系
}
```

### 字段映射配置

```
✅ Enable custom field mapping

Core Fields:
Title → title
Content → description
Author → author
Publish Time → publishTime
Source URL → sourceUrl
Slug → slug

Enhanced Metadata:
Site Name → siteName
Language → language
Tags/Keywords → tags
Reading Time → readingTime
Created At → extractedAt
```

## 📱 使用示例

### 微信文章提取结果

```json
{
  "title": "人工智能技术发展趋势分析",
  "description": "深入分析当前AI技术的发展现状和未来趋势...",
  "author": "技术前沿",
  "publishTime": "2024-12-22",
  "sourceUrl": "https://mp.weixin.qq.com/s/...",
  "siteName": "微信公众号",
  "language": "zh-CN",
  "tags": ["AI", "技术", "趋势", "分析"],
  "readingTime": 8,
  "extractedAt": "2024-12-22T10:30:00.000Z",
  "slug": "ren-gong-zhi-neng-ji-shu-fa-zhan-qu-shi-fen-xi"
}
```

### 英文技术博客提取结果

```json
{
  "title": "Modern JavaScript Frameworks Comparison",
  "description": "A comprehensive comparison of React, Vue, and Angular...",
  "author": "John Developer",
  "publishTime": "2024-12-20",
  "sourceUrl": "https://techblog.com/frameworks-comparison",
  "siteName": "TechBlog",
  "language": "en",
  "tags": ["javascript", "react", "vue", "angular", "frameworks"],
  "readingTime": 12,
  "extractedAt": "2024-12-22T10:35:00.000Z"
}
```

## 🛠️ 高级配置

### DOM 清理规则

```json
[
  {
    "type": "id",
    "value": "content_bottom_area",
    "description": "微信底部推荐区域",
    "domains": ["mp.weixin.qq.com"]
  },
  {
    "type": "class",
    "value": "advertisement",
    "description": "广告区域"
  }
]
```

### 内容处理设置

```
✅ Auto-generate slug from title
❌ Upload images to Strapi (可选)
✅ Clean HTML content
✅ Enable DOM cleanup rules
Content Max Length: 50000
Max Images: 10
```

## 🔍 调试和日志

### 查看提取日志

1. 打开开发者工具 (F12)
2. 切换到 Console 标签
3. 执行文章提取
4. 查看详细日志输出

### 典型日志输出

```
🔍 Extracting enhanced metadata...
✅ Enhanced metadata extracted:
   Title: 人工智能的发展趋势与挑战...
   Author: 张三
   Published: 2024-12-22
   Site Name: 微信公众号
   Tags: 3 tags found
   Reading Time: 5 minutes
🎯 Enhanced article with metadata ready for Strapi
```

## 🎨 界面功能

### 扩展弹窗
- **Preview**: 预览提取结果
- **Extract & Send**: 提取并发送到 Strapi
- **Options**: 打开设置页面

### 设置页面功能
- **📡 Strapi Connection**: 连接配置
- **🔗 Field Mapping**: 字段映射
- **📊 Enhanced Metadata**: 元数据字段配置
- **⚙️ Advanced Settings**: 高级选项
- **💾 Backup/Restore**: 设置备份还原

## ❓ 常见问题

### Q: 元数据提取不完整怎么办？
A: 部分网站可能缺少标准元数据标签，扩展会使用智能回退策略。检查控制台日志以了解具体情况。

### Q: 如何处理中文内容？
A: 扩展完全支持中文内容，包括自动语言检测和中文URL slug生成。

### Q: 可以批量处理文章吗？
A: 当前版本支持单篇文章处理，批量功能在开发规划中。

### Q: 如何备份配置？
A: 使用设置页面的 "💾 Backup Settings" 按钮导出配置文件。

## 🚀 最佳实践

1. **渐进配置**: 从基础字段开始，逐步启用增强元数据
2. **定期备份**: 使用备份功能保存配置
3. **监控日志**: 关注控制台输出以优化提取效果
4. **测试验证**: 在不同网站测试提取质量
5. **字段验证**: 确保 Strapi 字段类型与数据匹配

## 📞 技术支持

- 📖 **详细文档**: 查看 `FIELD_MAPPING_GUIDE.md`
- 🔧 **高级配置**: 参考 `ENHANCEMENT_SUMMARY.md`
- 🏗️ **开发指南**: 阅读 `DEVELOPMENT.md`
- ⚙️ **技术细节**: 查看 `TECHNICAL.md`

---

**Enhanced Article Extractor v0.2.0 - 专业级内容提取，丰富元数据收集** 