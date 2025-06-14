# 字段预设值功能演示

## 功能概述

新增的字段预设值功能允许您为特定字段设置固定的默认值，这些值会自动应用到所有提取的文章中。

## 使用场景

根据您提供的截图，这个功能特别适用于以下场景：

1. **新闻来源标识** - 设置固定的 `news_source` 为 "reprint"
2. **显示类型** - 设置固定的 `show_type` 为 "banner"
3. **分类标签** - 为所有文章设置统一的分类或标签
4. **状态字段** - 设置默认的发布状态或审核状态

## 配置步骤

### 1. 启用预设值功能

1. 打开扩展的设置页面
2. 找到 "🎯 Field Presets" 部分
3. 勾选 "Enable field presets"

### 2. 添加预设字段

点击 "+ Add Preset Field" 按钮，为每个预设字段配置：

- **Field name**: Strapi集合中的字段名称（如：`news_source`）
- **Field type**: 字段类型（Text/Number/Boolean/JSON）
- **Default value**: 要设置的默认值（如：`reprint`）

### 3. 示例配置

根据您的截图，可以这样配置：

```
Field name: news_source
Field type: Text
Default value: reprint

Field name: show_type  
Field type: Text
Default value: banner
```

## 字段类型说明

- **Text**: 文本字符串，适用于大多数场景
- **Number**: 数字类型，会自动转换为数值
- **Boolean**: 布尔值，支持 true/false 或 1/0
- **JSON**: JSON对象或数组，需要输入有效的JSON格式

## 工作原理

1. 当文章被提取时，系统首先处理所有映射的字段
2. 然后应用预设值，**预设值会覆盖任何提取到的值**
3. 最终数据发送到Strapi时包含所有预设字段

## 注意事项

⚠️ **重要提示**：
- 预设值会覆盖提取到的同名字段值
- 字段名称必须与Strapi集合中的实际字段名称匹配
- 只有填写了值的预设字段才会被应用
- 建议先在Strapi中创建对应的字段

## 调试和验证

使用设置页面的 "Test Data Generation" 功能可以预览最终发送到Strapi的数据结构，包括应用的预设值。

## 与字段映射的关系

预设值功能与字段映射功能是独立的：
- 字段映射：控制提取的数据如何映射到Strapi字段
- 预设值：为特定字段设置固定值，无论是否有映射

两个功能可以同时使用，预设值会在字段映射之后应用。 