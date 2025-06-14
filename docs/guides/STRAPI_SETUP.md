# Strapi CMS 配置指南

## 📋 概述

本指南将帮助您在Strapi中正确配置collection和字段，以确保WechatArticle2Strapi扩展能够正常工作。

## 🏗️ 步骤 1: 创建Article Collection

### 1.1 登录Strapi管理后台
1. 打开您的Strapi管理面板
2. 使用管理员账户登录

### 1.2 创建新的Collection Type
1. 在左侧菜单中点击 **"Content-Types Builder"**
2. 点击 **"Create new collection type"**
3. 输入集合名称：`articles` （或您喜欢的名称）
4. 点击 **"Continue"**

## 🔧 步骤 2: 配置字段

### 2.1 必需字段配置

#### 2.1.1 Title字段（标题）
- **字段类型**: Text
- **字段名**: `title`
- **配置选项**:
  - ✅ Required
  - ✅ Unique
  - Max length: 255

#### 2.1.2 Content字段（内容）
- **字段类型**: Rich Text (Markdown)
- **字段名**: `content`
- **配置选项**:
  - ✅ Required
  - Max length: 100000 （或更大）

### 2.2 可选字段配置

#### 2.2.1 Author字段（作者）
- **字段类型**: Text
- **字段名**: `author`
- **配置选项**:
  - Max length: 100

#### 2.2.2 PublishTime字段（发布时间）
- **字段类型**: Text
- **字段名**: `publishTime`
- **配置选项**:
  - Max length: 50

#### 2.2.3 Digest字段（摘要）
- **字段类型**: Text
- **字段名**: `digest`
- **配置选项**:
  - Max length: 1000

#### 2.2.4 SourceUrl字段（原文链接）
- **字段类型**: Text
- **字段名**: `sourceUrl`
- **配置选项**:
  - Max length: 500

#### 2.2.5 ImportedAt字段（导入时间）
- **字段类型**: DateTime
- **字段名**: `importedAt`

#### 2.2.6 Images字段（图片信息）
- **字段类型**: JSON
- **字段名**: `images`

#### 2.2.7 OriginalContentLength字段（原始内容长度）
- **字段类型**: Integer
- **字段名**: `originalContentLength`

## ⚙️ 步骤 3: 权限配置

### 3.1 创建API Token
1. 进入 **Settings** → **API Tokens**
2. 点击 **"Create new API Token"**
3. 配置Token：
   - **Name**: `WechatArticle2Strapi`
   - **Token type**: Full access 或 Custom
   - **Token duration**: Unlimited

### 3.2 设置权限
如果选择Custom权限，请确保包含：
- **Articles**: 
  - ✅ Find
  - ✅ Create
  - ✅ Update
- **Upload**:
  - ✅ Upload

### 3.3 保存并复制Token
⚠️ **重要**: 复制生成的token并保存，它只会显示一次！

## 📊 步骤 4: 验证配置

### 4.1 测试API访问
使用以下命令测试配置是否正确：

```bash
# 替换YOUR_STRAPI_URL和YOUR_TOKEN
curl -X GET "YOUR_STRAPI_URL/api/articles" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4.2 预期响应
正确配置应该返回：
```json
{
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 0,
      "total": 0
    }
  }
}
```

## 🛠️ 故障排除

### 常见错误及解决方案

#### 错误 1: "Invalid key content"
**原因**: content字段不存在或配置错误
**解决方案**:
1. 确保创建了 `content` 字段
2. 字段类型应为 Rich Text 或 Text (Long)
3. 确保字段名拼写正确

#### 错误 2: "Validation Error"
**原因**: 字段长度限制或必填字段缺失
**解决方案**:
1. 检查必填字段是否都已创建
2. 增加字段的最大长度限制
3. 确保所有字段名与代码中的一致

#### 错误 3: "Unauthorized"
**原因**: API Token权限不足
**解决方案**:
1. 重新生成API Token
2. 确保Token有正确的权限
3. 检查Token是否已过期

#### 错误 4: "Collection not found"
**原因**: Collection名称不匹配
**解决方案**:
1. 确保Collection名称与扩展配置中的一致
2. 检查Collection是否已发布

## 📝 推荐的Collection配置

### 最小配置（仅必需字段）
```javascript
{
  title: "Text (Required, Unique, Max: 255)",
  content: "Rich Text (Required, Max: 100000)"
}
```

### 完整配置（所有字段）
```javascript
{
  title: "Text (Required, Unique, Max: 255)",
  content: "Rich Text (Required, Max: 100000)",
  author: "Text (Max: 100)",
  publishTime: "Text (Max: 50)",
  digest: "Text (Max: 1000)",
  sourceUrl: "Text (Max: 500)",
  importedAt: "DateTime",
  images: "JSON",
  originalContentLength: "Integer"
}
```

## 🔄 数据结构示例

扩展将发送类似以下结构的数据：

```json
{
  "data": {
    "title": "文章标题",
    "content": "<p>清理后的文章内容...</p>",
    "author": "作者名称",
    "publishTime": "2025年05月15日 17:15",
    "digest": "文章摘要",
    "sourceUrl": "https://mp.weixin.qq.com/s/...",
    "importedAt": "2024-12-20T10:30:00.000Z",
    "images": [
      {
        "original": "https://mmbiz.qpic.cn/...",
        "uploaded": "/uploads/image.jpg",
        "id": 123
      }
    ],
    "originalContentLength": 184837
  }
}
```

## 📞 技术支持

如果您在配置过程中遇到问题：

1. 检查Strapi版本兼容性（推荐v4+）
2. 查看Strapi控制台日志
3. 验证数据库连接
4. 确认所有字段权限设置正确

---

**提示**: 确保在生产环境中使用HTTPS协议，并定期更新API Token以保证安全性。 