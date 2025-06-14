# 📘 Article Extractor CLI v2 - Playwright 版本使用指南

> **🚀 新版本特性：使用真实浏览器环境，支持动态渲染的网页内容提取**

## 🎯 **主要改进**

### ✨ **核心优势**
- **真实浏览器环境**：使用 Playwright 驱动 Chromium/Firefox/WebKit
- **动态内容支持**：完美处理 JavaScript 渲染的内容
- **智能等待策略**：自动等待页面内容加载完成
- **反爬虫能力**：更好的反检测和绕过能力
- **完整兼容性**：保持与 v1 版本 100% 的 API 兼容

### 🆚 **v1 vs v2 对比**

| 特性 | v1 (axios + JSDOM) | v2 (Playwright) |
|------|-------------------|-----------------|
| 静态内容提取 | ✅ | ✅ |
| 动态内容提取 | ❌ | ✅ |
| JavaScript 执行 | ❌ | ✅ |
| SPA 应用支持 | ❌ | ✅ |
| 反爬虫能力 | 基础 | 强 |
| 性能 | 快 | 中等 |
| 资源占用 | 低 | 中等 |

## 🛠️ **安装与设置**

### 1. **安装依赖**
```bash
# 安装包依赖
npm install

# 安装 Playwright 浏览器 (必需)
npx playwright install chromium
# 或安装所有浏览器
npx playwright install
```

### 2. **使用内置命令安装**
```bash
# 使用 CLI 内置命令安装浏览器
article-extractor-v2 install-browsers

# 只安装特定浏览器
article-extractor-v2 install-browsers --chromium
article-extractor-v2 install-browsers --firefox
article-extractor-v2 install-browsers --webkit
```

## 🚀 **基本使用**

### **基础命令**
```bash
# 基本提取
article-extractor-v2 "https://example.com/article"

# 详细输出
article-extractor-v2 "https://example.com/article" -v

# 调试模式
article-extractor-v2 "https://example.com/article" -d
```

### **微信文章提取**
```bash
# 微信文章 (自动优化等待策略)
article-extractor-v2 "https://mp.weixin.qq.com/s/xxxxx" -v

# 微信文章 + Strapi 上传
article-extractor-v2 "https://mp.weixin.qq.com/s/xxxxx" --strapi --upload-images
```

## ⚙️ **Playwright 特有选项**

### **浏览器选择**
```bash
# 使用 Chromium (默认)
article-extractor-v2 "URL" --browser chromium

# 使用 Firefox
article-extractor-v2 "URL" --browser firefox

# 使用 WebKit (Safari)
article-extractor-v2 "URL" --browser webkit
```

### **显示模式**
```bash
# 无头模式 (默认)
article-extractor-v2 "URL"

# 有头模式 (显示浏览器窗口)
article-extractor-v2 "URL" --no-headless

# 调试时查看浏览器界面
article-extractor-v2 "URL" --no-headless -d
```

### **等待策略**
```bash
# 等待特定元素出现
article-extractor-v2 "URL" --wait-for ".content"

# 自定义等待超时时间
article-extractor-v2 "URL" --wait-timeout 60000

# 微信文章 (自动等待 .rich_media_content)
article-extractor-v2 "https://mp.weixin.qq.com/s/xxxxx"
```

### **性能优化**
```bash
# 禁用图片加载 (默认，提高速度)
article-extractor-v2 "URL"

# 启用图片加载
article-extractor-v2 "URL" --load-images

# 自定义视窗大小
article-extractor-v2 "URL" --viewport 1366x768

# 使用用户数据目录 (保持登录状态)
article-extractor-v2 "URL" --user-data-dir "/path/to/userdata"
```

## 🔧 **高级功能**

### **页面信息获取**
```bash
# 获取页面详细信息 (调试用)
article-extractor-v2 page-info "URL"

# 使用不同浏览器获取信息
article-extractor-v2 page-info "URL" --browser firefox
```

### **截图功能**
```bash
# 调试模式下自动截图
article-extractor-v2 "URL" -d --screenshot

# 截图保存在当前目录
```

### **配置管理**
```bash
# 生成配置文件模板
article-extractor-v2 init

# 使用自定义配置文件
article-extractor-v2 "URL" -c ./my-config.json

# 导入 Chrome 扩展备份
article-extractor-v2 import-chrome-backup ./backup.json
```

## 📊 **实际使用场景**

### **场景1：SPA 应用内容提取**
```bash
# React/Vue 等 SPA 应用
article-extractor-v2 "https://spa-app.com/article/123" \
  --wait-for "[data-article-content]" \
  --wait-timeout 10000 \
  -v
```

### **场景2：需要登录的页面**
```bash
# 使用用户数据目录保持登录状态
article-extractor-v2 "https://members-only.com/article" \
  --user-data-dir "./browser-data" \
  --no-headless  # 首次运行时手动登录
```

### **场景3：复杂动态页面**
```bash
# 等待内容完全加载
article-extractor-v2 "https://complex-site.com/article" \
  --wait-for ".article-body.loaded" \
  --load-images \
  --wait-timeout 30000 \
  -v
```

### **场景4：批量处理优化**
```bash
# 使用最快设置批量处理
article-extractor-v2 "URL" \
  --browser chromium \
  --headless \
  --wait-timeout 15000 \
  --output json > result.json
```

## 🐛 **故障排除**

### **常见问题**

1. **浏览器未安装**
   ```bash
   # 错误：browser not found
   # 解决：安装浏览器
   npx playwright install chromium
   ```

2. **页面加载超时**
   ```bash
   # 增加超时时间
   article-extractor-v2 "URL" --wait-timeout 60000
   
   # 或禁用等待特定元素
   article-extractor-v2 "URL" --wait-for ""
   ```

3. **内存不足**
   ```bash
   # 使用无头模式 + 禁用图片
   article-extractor-v2 "URL" --headless --no-load-images
   ```

4. **被检测为机器人**
   ```bash
   # 使用用户数据目录 + 自定义 User-Agent
   article-extractor-v2 "URL" --user-data-dir "./data"
   ```

### **调试模式**
```bash
# 开启详细调试信息
article-extractor-v2 "URL" -d -v

# 查看浏览器界面
article-extractor-v2 "URL" -d --no-headless

# 保存截图
article-extractor-v2 "URL" -d --screenshot
```

## 🔄 **迁移指南**

### **从 v1 迁移到 v2**

✅ **完全兼容的命令**
```bash
# v1 和 v2 都支持
article-extractor "URL" -v --strapi
article-extractor-v2 "URL" -v --strapi  # 完全相同
```

🆕 **v2 新增选项**
```bash
# v2 独有的 Playwright 选项
article-extractor-v2 "URL" \
  --browser firefox \        # 新增
  --wait-for ".content" \    # 新增
  --no-headless \           # 新增
  --load-images             # 新增
```

### **性能对比测试**
```bash
# 测试 v1 性能
time article-extractor "URL" -v

# 测试 v2 性能
time article-extractor-v2 "URL" -v

# v2 快速模式
time article-extractor-v2 "URL" \
  --wait-timeout 5000 \
  --headless
```

## 🎯 **最佳实践**

### **生产环境使用**
```bash
# 推荐的生产环境设置
article-extractor-v2 "URL" \
  --browser chromium \
  --headless \
  --wait-timeout 20000 \
  --output json \
  --max-images 5 \
  --quality 0.7
```

### **开发调试使用**
```bash
# 推荐的开发调试设置
article-extractor-v2 "URL" \
  --no-headless \
  --debug \
  --verbose \
  --screenshot \
  --wait-for ".main-content"
```

### **批量处理使用**
```bash
# 批量处理脚本示例
for url in $(cat urls.txt); do
  article-extractor-v2 "$url" \
    --headless \
    --wait-timeout 10000 \
    --output json > "output_$(date +%s).json"
  sleep 2  # 避免请求过于频繁
done
```

## 📚 **技术细节**

### **等待策略说明**
- **微信文章**：自动等待 `.rich_media_content` 或 `#js_content`
- **通用页面**：等待 `networkidle` 或常见内容选择器
- **自定义**：使用 `--wait-for` 指定特定选择器

### **资源优化**
- **默认禁用**：图片、字体、CSS (可配置)
- **智能检测**：根据 URL 类型调整等待策略
- **内存管理**：自动清理浏览器进程

### **反检测机制**
- **真实浏览器**：使用真实的浏览器指纹
- **User-Agent**：可自定义浏览器标识
- **用户数据**：支持保持登录状态

---

## 🤝 **支持与反馈**

如果在使用过程中遇到问题，请：
1. 首先尝试调试模式：`-d -v`
2. 检查浏览器是否正确安装
3. 尝试不同的等待策略和超时设置
4. 查看本文档的故障排除部分

**享受更强大的动态内容提取能力！** 🎉