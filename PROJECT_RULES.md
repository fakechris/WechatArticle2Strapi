# WechatArticle2Strapi 项目规范文档

## 🗂️ 1. 文档管理规范

### 1.1 版本发布流程
每次大的系统改版和任务完成时，必须按照以下顺序更新：

#### 版本号更新规则
- **主版本 (Major)**: 架构重大变更、破坏性更新 `x.0.0`
- **次版本 (Minor)**: 新功能添加、重要特性 `x.y.0`
- **修订版本 (Patch)**: Bug修复、小改进 `x.y.z`

#### 必须更新的文件
1. **package.json** - 主项目版本号
2. **cli/package.json** - CLI工具版本号  
3. **CHANGELOG.md** - 详细变更记录
4. **README.md** - 项目概述和使用说明
5. **docs/README.md** - 文档索引更新

#### 更新检查清单
```markdown
- [ ] 更新根目录 package.json 版本号
- [ ] 更新 cli/package.json 版本号（如涉及CLI变更）
- [ ] 在 CHANGELOG.md 中添加新版本条目
- [ ] 更新 README.md 中的版本相关信息
- [ ] 更新 docs/README.md 中的新功能文档链接
- [ ] 确认所有新功能都有对应的文档
- [ ] 运行完整测试（如有）
- [ ] 创建 Git tag: `git tag v1.x.x`
```

### 1.2 文档结构维护
```
docs/
├── README.md                    # 文档总索引（必须更新）
├── guides/                      # 用户指南
├── development/                 # 开发文档  
├── technical/                   # 技术规范
├── summaries/                   # 版本总结
├── examples/                    # 使用示例
└── cli/                        # CLI文档
```

### 1.3 新功能文档要求
每个新功能必须包含：
- **功能说明** - 用途和使用场景
- **使用指南** - 详细操作步骤
- **配置说明** - 相关配置项
- **示例代码** - 实际使用示例
- **故障排除** - 常见问题解决

## 🔧 2. 临时文件管理规则

### 2.1 临时文件目录结构
所有临时文件必须在专门的temp目录下创建：

```
temp/
├── debug/                       # 调试文件
│   ├── debug-*.js
│   ├── debug-*.html
│   └── debug-*.json
├── test/                        # 测试脚本
│   ├── test-*.js
│   ├── *-test.js
│   └── test-*.html
├── demo/                        # 演示文件
│   ├── demo-*.js
│   └── demo-examples/
└── temp-scripts/                # 临时脚本
    ├── temp-*.js
    └── one-time-*.js
```

### 2.2 临时文件命名规范
- 调试文件: `debug-[功能名]-[日期].js`
- 测试文件: `test-[功能名].js` 或 `[功能名]-test.js`
- 演示文件: `demo-[功能名].js`
- 临时脚本: `temp-[目的]-[日期].js`

### 2.3 临时文件管理规则
1. **创建规则**
   - 所有临时文件必须在 `temp/` 目录下创建
   - 使用有意义的文件名和注释
   - 在文件开头注明创建目的和日期

2. **清理规则**
   - 每月第一周清理过期临时文件
   - 任务完成后立即清理相关临时文件
   - 保留有价值的测试用例，移至正式测试目录

3. **版本控制**
   - temp目录默认被.gitignore忽略
   - 重要的临时文件可以添加到版本控制
   - 使用 `git add temp/specific-file.js` 手动添加

## 🏗️ 3. 项目架构文档

### 3.1 整体架构概览
WechatArticle2Strapi 是一个多组件系统，包含三个主要部分：

```
┌─────────────────────────────────────────────────────────────┐
│                  WechatArticle2Strapi                      │
├─────────────────┬───────────────────┬─────────────────────┤
│  Chrome         │    Node.js        │     Shared          │
│  Extension      │    CLI Tools      │     Logic           │
│                 │                   │                     │
│  ┌───────────┐  │  ┌─────────────┐  │  ┌───────────────┐  │
│  │ Content   │  │  │ Article     │  │  │ Core Utils    │  │
│  │ Scripts   │  │  │ Extractor   │  │  │               │  │
│  ├───────────┤  │  ├─────────────┤  │  ├───────────────┤  │
│  │ Background│  │  │ Playwright  │  │  │ Constants     │  │
│  │ Service   │  │  │ Automation  │  │  │               │  │
│  ├───────────┤  │  ├─────────────┤  │  ├───────────────┤  │
│  │ Popup UI  │  │  │ Strapi      │  │  │ Types         │  │
│  │           │  │  │ Integration │  │  │               │  │
│  └───────────┘  │  └─────────────┘  │  └───────────────┘  │
└─────────────────┴───────────────────┴─────────────────────┘
```

### 3.2 Chrome Extension 架构

#### 3.2.1 核心组件
```
src/
├── background.js              # Service Worker (主要业务逻辑)
├── background-refactored.js   # 重构版本的后台服务
├── content-unified.js         # 内容脚本统一版本
├── content-bundled.js         # 打包版本内容脚本
├── popup.js + popup.html      # 弹窗界面
└── options.js + options.html  # 选项设置页面
```

#### 3.2.2 Extension 特性
- **Content Security Policy (CSP)** 兼容
- **Manifest V3** 支持
- **动态内容注入** 和文章提取
- **实时预览** 和配置管理
- **多网站适配** (微信公众号等)

### 3.3 Node.js CLI Tools 架构

#### 3.3.1 CLI 工具结构
```
cli/
├── package.json               # CLI专用依赖配置
├── bin/                       # 可执行脚本
│   ├── cli.js                # 主CLI入口
│   ├── cli_v2.js             # V2版本CLI
│   └── strapi-import.js      # Strapi导入工具
├── src/                      # CLI源代码
├── examples/                 # 使用示例
└── .articlerc.json          # CLI配置文件
```

#### 3.3.2 CLI 功能特性
- **批量文章处理** - 支持CSV批量导入
- **Playwright自动化** - 自动浏览器操作
- **Strapi集成** - 直接上传到CMS
- **图片优化** - 自动压缩和格式转换
- **智能去重** - 防止重复内容

### 3.4 Shared Logic 架构

#### 3.4.1 共享模块结构
```
shared/
├── package.json              # 共享依赖
├── core/                     # 核心业务逻辑
├── utils/                    # 通用工具函数
├── constants/                # 常量定义
└── types/                    # TypeScript类型定义
```

#### 3.4.2 核心共享功能
- **文章解析引擎** - HTML内容提取和清理
- **图片处理** - 下载、优化、上传逻辑
- **配置管理** - 统一的配置系统
- **数据验证** - 输入验证和清理
- **错误处理** - 统一的错误处理机制

### 3.5 技术栈和依赖

#### 3.5.1 主要技术栈
```
Chrome Extension:
├── Vanilla JavaScript (ES6+)
├── Chrome Extension APIs
├── Webpack (打包构建)
└── HTML/CSS

Node.js CLI:
├── Node.js 16+
├── Playwright (浏览器自动化)
├── Commander.js (CLI框架)
├── Sharp (图片处理)
├── Axios (HTTP请求)
└── JSDOM (HTML解析)

Shared:
├── Defuddle (内容清理)
├── Transliteration (中文处理)
├── Validator (数据验证)
└── Image-size (图片信息)
```

#### 3.5.2 关键依赖说明
- **Playwright**: 提供浏览器自动化，支持复杂的页面交互
- **Defuddle**: 智能内容清理，去除广告和无关内容
- **Sharp**: 高性能图片处理，支持压缩和格式转换
- **Webpack**: 打包Chrome Extension，处理模块依赖

### 3.6 数据流架构

#### 3.6.1 Extension数据流
```
用户操作 → Popup界面 → Background Service → Content Script → 
页面DOM → 内容提取 → 数据处理 → Strapi上传 → 结果反馈
```

#### 3.6.2 CLI数据流
```
CSV输入 → 配置解析 → Playwright启动 → 页面访问 → 
内容提取 → Shared Logic处理 → 图片下载优化 → 
Strapi批量上传 → 进度报告 → 结果输出
```

### 3.7 配置管理架构

#### 3.7.1 统一配置系统
- **Extension配置**: Chrome Storage API
- **CLI配置**: .articlerc.json
- **共享配置**: 通过shared/constants统一管理

#### 3.7.2 配置优先级
1. 用户自定义配置
2. 项目配置文件
3. 默认配置
4. 环境变量

### 3.8 编码规范

#### 3.8.1 通用规范
- 使用ES6+语法
- 采用模块化设计
- 统一错误处理
- 详细的JSDoc注释
- 语义化命名

#### 3.8.2 Extension特定规范
- 遵循Manifest V3规范
- 异步操作使用async/await
- 消息传递使用Chrome API
- 内容脚本隔离执行环境

#### 3.8.3 CLI特定规范
- 使用Commander.js参数解析
- 提供详细的help信息
- 支持配置文件和命令行参数
- 友好的错误提示和进度显示

## 📋 4. 维护检查清单

### 4.1 每日检查
- [ ] 临时文件清理
- [ ] 错误日志检查
- [ ] 依赖安全更新

### 4.2 每周检查
- [ ] 文档链接有效性
- [ ] 示例代码可用性
- [ ] 性能指标监控

### 4.3 每月检查
- [ ] 依赖版本更新
- [ ] 架构文档更新
- [ ] 用户反馈整理

---

*此文档最后更新：2024年12月 | 项目版本：v1.2.0*