# WechatArticle2Strapi 开发文档

## 项目简介

WechatArticle2Strapi 是一个Chrome扩展，可以将微信公众号文章一键转换并导入到Strapi CMS系统中。

## 功能特性

- ✅ 智能提取微信文章内容（标题、作者、正文、发布时间等）
- ✅ 自动下载并处理文章中的图片
- ✅ 将图片上传到Strapi媒体库
- ✅ 创建格式化的文章内容
- ✅ 支持内容预览
- ✅ 友好的用户界面
- ✅ 配置管理和验证

## 安装和开发

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/WechatArticle2Strapi.git
cd WechatArticle2Strapi
```

### 2. 安装Chrome扩展
1. 打开Chrome浏览器
2. 进入 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录

### 3. 配置Strapi
1. 点击扩展图标
2. 点击"Open Settings"
3. 填写配置信息：
   - **Strapi URL**: 你的Strapi实例地址（如：https://your-strapi.com）
   - **Collection Name**: 文章集合名称（如：articles）
   - **API Token**: Strapi API令牌

## 使用方法

### 获取Strapi API Token
1. 登录Strapi管理后台
2. 进入 Settings → API Tokens
3. 创建新的API Token
4. 设置权限为对应集合的读写权限
5. 复制生成的token

### 使用扩展
1. 打开微信公众号文章页面
2. 点击扩展图标
3. 点击"Preview"预览提取的内容
4. 点击"Extract & Send"一键转换并上传

## 项目结构

```
WechatArticle2Strapi/
├── manifest.json          # Chrome扩展配置文件
├── src/
│   ├── content.js         # 内容脚本 - 提取文章内容
│   ├── background.js      # 后台脚本 - 处理API调用
│   ├── popup.html         # 弹窗界面
│   ├── popup.js           # 弹窗脚本
│   ├── options.html       # 配置页面
│   └── options.js         # 配置脚本
├── icons/                 # 扩展图标
├── PRD.md                # 产品需求文档
├── DEVELOPMENT.md        # 开发文档
└── README.md             # 项目说明
```

## 技术架构

### Content Script (`content.js`)
- 注入到微信文章页面
- 负责提取文章内容和图片信息
- 处理图片下载

### Background Script (`background.js`)
- 处理Strapi API调用
- 管理图片上传
- 错误处理和重试机制

### Popup (`popup.html/js`)
- 用户交互界面
- 文章预览功能
- 状态反馈

### Options (`options.html/js`)
- 配置管理页面
- 输入验证
- 连接测试

## API接口

### Strapi集成
扩展使用以下Strapi API：

- `GET /api/{collection}` - 测试连接和权限
- `POST /api/upload` - 上传图片到媒体库
- `POST /api/{collection}` - 创建文章记录

### 数据结构
上传到Strapi的文章数据结构：
```json
{
  "title": "文章标题",
  "content": "文章内容HTML",
  "author": "作者名称",
  "publishTime": "发布时间",
  "digest": "文章摘要",
  "sourceUrl": "原文链接",
  "importedAt": "导入时间",
  "images": [
    {
      "original": "原始图片URL",
      "uploaded": "Strapi图片URL",
      "id": "Strapi媒体ID"
    }
  ]
}
```

## 常见问题

### Q: 扩展无法提取文章内容
A: 确保你在微信公众号文章页面（mp.weixin.qq.com），页面完全加载后再使用扩展。

### Q: 图片上传失败
A: 检查Strapi配置，确保API Token有上传权限，网络连接正常。

### Q: API调用失败
A: 检查Strapi URL是否正确，collection是否存在，API Token是否有效。

### Q: 图片显示不正常
A: 微信图片可能有防盗链保护，扩展会自动下载并重新上传到Strapi。

## 开发注意事项

1. **权限最小化**: 只请求必需的Chrome权限
2. **错误处理**: 所有API调用都应有适当的错误处理
3. **用户体验**: 提供清晰的状态反馈和错误信息
4. **性能优化**: 图片处理和API调用使用异步方式
5. **安全性**: 敏感信息使用Chrome Storage API安全存储

## 调试技巧

1. **查看控制台**: 在扩展页面按F12查看错误信息
2. **检查网络**: 查看API调用是否成功
3. **存储检查**: chrome://extensions/ → 扩展详情 → 查看视图
4. **权限检查**: 确保manifest.json中的权限正确配置

## 版本更新

当前版本: v0.1.0

### 已知问题
- 部分复杂格式的文章可能提取不完整
- 图片处理在网络较慢时可能超时
- 某些特殊字符可能需要额外处理

### 计划功能
- 批量处理多篇文章
- 更多CMS系统支持
- 内容格式化选项
- 同步历史记录

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

本项目基于MIT许可证开源。 