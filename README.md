# 🚀 Enhanced Article Extractor

![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)
![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

一个受 **Obsidian Clipper** 启发的强大 Chrome 扩展，能够从任意网页提取丰富的元数据并保存到 Strapi CMS。支持专业级的内容提取和智能元数据收集。

## ✨ 核心特性

### 🎯 专业级内容提取
- **多引擎支持**: Defuddle + WeChat 选择器的智能组合
- **内容纯化**: 自动移除 89% 的噪音内容（广告、导航、评论等）
- **图片优化**: 智能筛选相关图片，提升 30% 过滤精度
- **性能卓越**: 16ms 智能过滤，内容可用性提升至 95%

### 🖼️ 头图自动上传功能 (v0.3.0 NEW!)
智能头图处理，一键完成封面图配置：

- **🎯 智能选择**: 根据索引自动选择文章中的图片作为头图
- **📤 自动上传**: 头图直接上传到Strapi媒体库
- **🔗 自动关联**: 媒体文件ID自动写入文章的头图字段
- **🏷️ 智能命名**: 基于文章标题生成有意义的文件名
- **⚡ 错误处理**: 优雅的错误处理，不影响主流程

### 📊 增强元数据提取
受 [Obsidian Clipper](https://github.com/obsidianmd/obsidian-clipper) 启发的专业元数据提取：

- **🔍 多源标题检测**: `og:title` → `twitter:title` → `<title>` → `<h1>`
- **👤 综合作者识别**: Meta 标签、署名行、作者元素、WeChat 特定选择器
- **📅 智能日期解析**: 多种日期格式的智能识别和标准化
- **🏷️ 关键词提取**: Meta keywords、标签、自动内容分析
- **🌐 语言检测**: 自动识别内容语言（中文/英文/其他）
- **⏱️ 阅读时间**: 基于内容长度的智能预估
- **📍 网站信息**: 平台名称、规范URL、时间戳

### 🔧 灵活的字段映射系统
- **可视化配置**: 直观的字段映射界面
- **类型识别**: 自动识别并提示 Strapi 字段类型
- **智能验证**: 字段长度和类型验证
- **映射预览**: 实时查看映射效果

## 🎯 支持的网站类型

| 网站类型 | 支持级别 | 特色功能 |
|----------|----------|----------|
| 📱 **微信公众号** | ⭐⭐⭐⭐⭐ | 完整元数据提取 + 专属选择器 |
| 🔍 **知乎专栏** | ⭐⭐⭐⭐ | 作者信息 + 标签优化 |
| 📝 **简书/CSDN** | ⭐⭐⭐⭐ | 技术内容优化 |
| 🌐 **通用网页** | ⭐⭐⭐ | 智能元数据提取 |

## ⚡ 快速开始

### 1. 安装扩展
```bash
# 1. 克隆项目
git clone https://github.com/your-repo/WechatArticle2Strapi.git

# 2. 安装依赖
npm install

# 3. 构建扩展
npm run build

# 4. 在 Chrome 中加载
# - 打开 chrome://extensions/
# - 启用开发者模式
# - 点击"加载已解压的扩展程序"
# - 选择 dist 文件夹
```

### 2. 配置 Strapi 连接
右键扩展图标 → 选项，配置：
```
📡 Strapi Connection
├── URL: https://your-strapi.com/api
├── Collection: articles
└── Token: your-api-token
```

### 3. 启用增强元数据（推荐）
```
✅ Enable custom field mapping

📊 Enhanced Metadata Fields:
├── Site Name → siteName
├── Language → language  
├── Tags/Keywords → tags
├── Reading Time → readingTime
└── Created At → extractedAt
```

### 4. 开始使用
1. 访问任意文章页面
2. 点击扩展图标
3. 预览提取结果
4. 一键保存到 Strapi

## 📊 提取结果示例

### 微信文章提取
```json
{
  \"title\": \"人工智能技术发展趋势分析\",
  \"description\": \"深入分析当前AI技术的发展现状...\",
  \"author\": \"技术前沿\",
  \"publishTime\": \"2024-12-22\",
  \"sourceUrl\": \"https://mp.weixin.qq.com/s/...\",
  \"siteName\": \"微信公众号\",
  \"language\": \"zh-CN\",
  \"tags\": [\"AI\", \"技术\", \"趋势\"],
  \"readingTime\": 8,
  \"extractedAt\": \"2024-12-22T10:30:00.000Z\"
}
```

### 英文技术博客
```json
{
  \"title\": \"Modern JavaScript Frameworks\",
  \"author\": \"John Developer\",
  \"siteName\": \"TechBlog\",
  \"language\": \"en\",
  \"tags\": [\"javascript\", \"react\", \"vue\"],
  \"readingTime\": 12
}
```

## 🏗️ Strapi 集合配置

### 推荐字段结构
```javascript
// Content Type: Article
{
  // 核心字段
  title: 'text',              // 文章标题
  description: 'richtext',    // 文章内容  
  slug: 'uid',               // URL标识符
  
  // 基础元数据
  author: 'text',            // 作者
  publishTime: 'text',       // 发布时间
  sourceUrl: 'text',         // 原始链接
  
  // 🖼️ 头图字段 (v0.3.0 NEW!)
  head_img: 'media',         // 头图/封面图 (单个媒体文件)
  
  // 增强元数据
  siteName: 'text',          // 网站名称
  language: 'text',          // 语言
  tags: 'json',             // 标签数组
  readingTime: 'integer',    // 阅读时间
  extractedAt: 'datetime'    // 提取时间
}
```

## 🔧 高级功能

### DOM 清理规则
```json
[
  {
    \"type\": \"id\",
    \"value\": \"content_bottom_area\",
    \"description\": \"微信底部推荐区域\",
    \"domains\": [\"mp.weixin.qq.com\"]
  }
]
```

### 内容处理选项
- ✅ 自动生成 URL slug
- ✅ HTML 内容清理
- ✅ DOM 噪音移除
- ⚙️ 内容长度限制
- 📷 图片数量控制

## 📚 文档目录

| 文档 | 描述 |
|------|------|
| 📖 [快速开始指南](QUICK_START_GUIDE.md) | 详细安装和使用指南 |
| 🖼️ [头图功能指南](HEAD_IMAGE_GUIDE.md) | 头图自动上传配置和使用 |
| 🔗 [字段映射指南](FIELD_MAPPING_GUIDE.md) | Strapi 字段配置说明 |
| 🚀 [功能增强摘要](ENHANCEMENT_SUMMARY.md) | 新功能详细介绍 |
| 🔧 [规则引擎演示](RULES_ENGINE_DEMO.md) | DOM 清理规则说明 |
| 📝 [更新记录](CHANGELOG.md) | 版本更新和功能变化记录 |

## 🏆 性能指标

| 指标 | 改善 | 说明 |
|------|------|------|
| 内容纯度 | 10% → 95% | 噪音内容移除效果 |
| 处理速度 | 16ms | 智能过滤处理时间 |
| 图片精度 | +30% | 相关图片识别准确率 |
| 元数据完整性 | +200% | 新增元数据字段数量 |

## 🔄 提取方法级联

1. **🎯 Defuddle + WeChat** - 微信文章最佳质量
2. **✨ Defuddle Enhanced** - 通用网页高质量提取  
3. **📱 WeChat Selectors** - 微信专用备用方案
4. **⚠️ Basic Extraction** - 最终备用方案

## 🛠️ 开发构建

```bash
# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build

# 清理构建文件
npm run clean
```

## 🤝 技术栈

- **内容提取**: [Defuddle](https://github.com/kepano/defuddle) - Obsidian Clipper 同款引擎
- **构建工具**: Webpack 5 + Babel
- **扩展平台**: Chrome Extension Manifest V3
- **后端集成**: Strapi CMS REST API

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**Enhanced Article Extractor v0.2.0**  
*专业级内容提取 • 丰富元数据收集 • 受 Obsidian Clipper 启发*

⭐ 如果这个项目对您有帮助，请给个 Star！
