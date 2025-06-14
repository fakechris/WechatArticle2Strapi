# Strapi CSV Import Tool

一个强大的命令行工具，用于将CSV文件批量导入到Strapi CMS中。

## 功能特性

- 🚀 **批量导入**: 支持大量数据的高效批量导入
- 🔄 **字段映射**: 自动应用现有的字段映射配置
- 🎯 **预设值**: 支持字段预设值和类型转换
- 📊 **进度显示**: 实时显示导入进度
- 🔍 **预览模式**: 支持干运行模式，预览导入数据
- ⚠️ **错误处理**: 灵活的错误处理和跳过策略
- 📝 **详细日志**: 可选的详细输出模式

## 安装

确保你已经在CLI目录中安装了依赖：

```bash
cd cli
npm install
```

## 基本用法

```bash
# 基本导入
npx strapi-import <collection_name> <csv_file>

# 使用自定义配置文件
npx strapi-import articles data.csv -c ./my-config.json

# 预览模式（不实际导入）
npx strapi-import articles data.csv --dry-run

# 详细输出模式
npx strapi-import articles data.csv --verbose

# 跳过错误继续导入
npx strapi-import articles data.csv --skip-errors

# 自定义批次大小
npx strapi-import articles data.csv --batch-size 20
```

## 命令选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-c, --config <file>` | 配置文件路径 | `.articlerc.json` |
| `-d, --dry-run` | 预览模式，不实际导入 | false |
| `-b, --batch-size <size>` | 批次大小 | 10 |
| `-v, --verbose` | 详细输出 | false |
| `--skip-errors` | 跳过错误行继续导入 | false |

## 配置文件

工具使用与Chrome扩展相同的配置文件格式 (`.articlerc.json`)：

```json
{
  "strapiUrl": "https://your-strapi-server.com",
  "token": "your-api-token",
  "collection": "default-collection",
  "fieldMapping": {
    "enabled": true,
    "fields": {
      "title": "title",
      "content": "content",
      "author": "author",
      "summary": "summary"
    }
  },
  "fieldPresets": {
    "enabled": true,
    "presets": {
      "news_source": {
        "type": "text",
        "value": "reprint"
      },
      "show_type": {
        "type": "text",
        "value": "list"
      }
    }
  }
}
```

## CSV文件格式

CSV文件应该包含标题行，列名对应你想要导入的字段：

```csv
title,content,summary,author,news_source
"文章标题1","文章内容1","文章摘要1","作者1","reprint"
"文章标题2","文章内容2","文章摘要2","作者2","original"
```

## 字段映射

工具支持灵活的字段映射：

1. **启用字段映射**: 如果配置中启用了字段映射，工具会按照映射规则将CSV字段转换为Strapi字段
2. **直接映射**: 如果CSV列名与Strapi字段名完全匹配，将直接映射
3. **自动映射**: 如果没有启用字段映射，CSV的所有列将直接作为Strapi字段

## 预设值

可以为特定字段设置预设值：

```json
{
  "fieldPresets": {
    "enabled": true,
    "presets": {
      "status": {
        "type": "text",
        "value": "published"
      },
      "priority": {
        "type": "number",
        "value": "1"
      },
      "is_featured": {
        "type": "boolean",
        "value": "false"
      }
    }
  }
}
```

支持的类型：
- `text`: 文本类型（默认）
- `number`: 数字类型
- `boolean`: 布尔类型
- `json`: JSON对象类型

## 使用示例

### 1. 基本导入

```bash
# 导入文章到 articles collection
npx strapi-import articles ./data/articles.csv
```

### 2. 预览导入

```bash
# 先预览，确认数据格式正确
npx strapi-import articles ./data/articles.csv --dry-run --verbose
```

### 3. 大批量导入

```bash
# 大文件导入，增加批次大小，跳过错误
npx strapi-import articles ./data/large-dataset.csv --batch-size 50 --skip-errors
```

### 4. 使用自定义配置

```bash
# 使用特定环境的配置文件
npx strapi-import products ./data/products.csv -c ./configs/production.json
```

## 错误处理

工具提供多种错误处理策略：

1. **立即停止** (默认): 遇到错误立即停止导入
2. **跳过错误**: 使用 `--skip-errors` 跳过有问题的行，继续处理其他行
3. **详细输出**: 使用 `--verbose` 查看详细的错误信息

## 常见问题

### Q: 如何处理中文字符？
A: 确保CSV文件使用UTF-8编码保存。

### Q: 导入速度太慢怎么办？
A: 可以增加批次大小 `--batch-size 50`，但不要设置过大以免超过API限制。

### Q: 如何验证导入结果？
A: 先使用 `--dry-run` 预览，确认无误后再正式导入。

### Q: 字段类型不匹配怎么办？
A: 检查字段映射配置，确保CSV数据格式与Strapi字段类型匹配。

## 示例文件

查看 `examples/sample-data.csv` 获取示例CSV格式。

## 许可证

MIT License