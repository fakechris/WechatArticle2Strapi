# 字段预设值功能使用指南

## 🎯 功能简介

字段预设值功能允许您为Strapi集合中的特定字段设置固定的默认值，这些值会自动应用到所有提取的文章中。

## 📋 快速配置

### 1. 启用功能
- 打开扩展设置页面
- 找到 "🎯 Field Presets" 部分
- 勾选 "Enable field presets"

### 2. 添加预设字段
点击 "+ Add Preset Field" 按钮，配置：
- **Field name**: Strapi字段名（如：`news_source`）
- **Field type**: 数据类型（Text/Number/Boolean/JSON）
- **Default value**: 默认值（如：`reprint`）

### 3. 常见配置示例

```
新闻来源:
Field name: news_source
Field type: Text  
Default value: reprint

显示类型:
Field name: show_type
Field type: Text
Default value: banner

发布状态:
Field name: published
Field type: Boolean
Default value: true

优先级:
Field name: priority
Field type: Number
Default value: 1

标签:
Field name: tags
Field type: JSON
Default value: ["imported", "wechat"]
```

## ⚙️ 字段类型说明

| 类型 | 说明 | 示例值 |
|------|------|--------|
| Text | 文本字符串 | `reprint`, `banner` |
| Number | 数字 | `1`, `100`, `3.14` |
| Boolean | 布尔值 | `true`, `false`, `1`, `0` |
| JSON | JSON格式 | `["tag1", "tag2"]`, `{"key": "value"}` |

## 🔄 工作流程

1. 文章提取 → 字段映射 → **应用预设值** → 发送到Strapi
2. 预设值会**覆盖**同名字段的提取值
3. 只有配置了值的预设字段才会被应用

## ⚠️ 注意事项

- 字段名必须与Strapi集合中的实际字段名匹配
- 预设值优先级最高，会覆盖提取的数据
- 建议先在Strapi中创建对应字段
- 使用 "Test Data Generation" 功能验证配置

## 🛠️ 调试技巧

1. 使用设置页面的 "Test Data Generation" 预览最终数据
2. 查看浏览器控制台的日志信息
3. 检查Strapi的字段定义是否匹配

## 💡 最佳实践

- 为常用的固定值字段设置预设值
- 使用有意义的字段名称
- 定期备份设置配置
- 测试后再批量处理文章 