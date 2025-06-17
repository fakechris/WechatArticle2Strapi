# 选择区域提取功能

Chrome Extension现在支持选择页面的特定区域进行内容提取，而不仅仅是提取整个页面。

## 🎯 功能概述

- **智能选择检测**: 自动检测用户在页面上的文本选择
- **选择状态显示**: 在Extension popup中显示选择状态
- **选择优先提取**: 用户可以选择只提取选定的内容
- **元数据保留**: 即使只提取选择内容，仍会从原页面获取标题、作者等元数据
- **回退机制**: 如果选择提取失败，自动回退到全页面提取

## 📋 使用方法

### 1. 选择页面内容

1. 在任何网页上，用鼠标选择你想要提取的文本内容
2. 可以选择段落、文章片段、或任何包含HTML格式的区域
3. 选择的内容会包含其HTML格式（图片、链接、列表等）

### 2. 使用Extension

1. 选择内容后，点击Chrome Extension图标
2. 如果检测到选择内容，会显示蓝色的选择状态框：
   ```
   📋 Selected Content Detected
   Selected: 选择的内容预览...
   ☑ Extract only selected content
   ```

### 3. 提取选择内容

- **Preview**: 点击Preview按钮预览选择的内容
- **Extract & Send**: 点击此按钮将选择的内容发送到Strapi

### 4. 控制选择模式

- 勾选 "Extract only selected content" 只提取选择的内容
- 取消勾选则恢复到全页面提取模式

## 🔧 技术实现

### Content Script增强

```javascript
// 检测页面选择状态
function getSelectionInfo() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return { hasSelection: false };
  }
  
  const selectedText = selection.toString().trim();
  if (!selectedText) {
    return { hasSelection: false };
  }
  
  return {
    hasSelection: true,
    selectedText: selectedText,
    selectedLength: selectedText.length,
    range: selection.getRangeAt(0),
    container: selection.getRangeAt(0).commonAncestorContainer
  };
}
```

### 选择提取逻辑

```javascript
// 从选择区域提取内容
async function extractFromSelection() {
  const selectionInfo = getSelectionInfo();
  if (!selectionInfo.hasSelection) {
    throw new Error('没有选择的内容');
  }
  
  // 创建包含选择内容的容器
  const selectionContainer = document.createElement('div');
  const range = selectionInfo.range;
  const contents = range.cloneContents();
  selectionContainer.appendChild(contents);
  
  // 使用WeChatExtractor处理选择的内容
  const result = await WeChatExtractor.extract(selectionContainer, window.location.href, {
    isSelection: true,
    originalDocument: document
  });
  
  return {
    ...result,
    isFromSelection: true,
    selectedText: selectionInfo.selectedText,
    selectedLength: selectionInfo.selectedLength
  };
}
```

### WeChatExtractor增强

WeChatExtractor现在支持两种模式：

1. **完整页面模式**: `extract(document, url, context)`
2. **选择区域模式**: `extract(selectedElement, url, {isSelection: true, originalDocument: document})`

在选择模式下：
- 只处理选择的DOM元素内容
- 从原始document获取页面元数据（title, author, meta tags等）
- 保持图片、链接等格式
- 生成合适的摘要信息

## 📊 提取结果对比

### 全页面提取
```json
{
  "title": "页面标题",
  "content": "完整页面内容...",
  "extractionMethod": "wechat-selectors",
  "isFromSelection": false
}
```

### 选择区域提取
```json
{
  "title": "页面标题", // 从原页面获取
  "content": "用户选择的内容...", // 只包含选择的部分
  "extractionMethod": "wechat-selectors-selection",
  "isFromSelection": true,
  "selectedText": "纯文本选择内容",
  "selectedLength": 150,
  "selectedContentLength": 1024
}
```

## 🚀 优势

1. **精确提取**: 只提取用户感兴趣的内容部分
2. **保持格式**: 选择的HTML格式得到完整保留
3. **元数据完整**: 页面级别的元数据仍然可用
4. **用户友好**: 直观的选择检测和状态显示
5. **智能回退**: 选择提取失败时自动回退到全页面提取

## 🧪 测试建议

使用提供的测试页面 `test-selection.html` 进行功能测试：

1. 打开测试页面
2. 选择蓝色框中的内容
3. 打开Extension检查选择检测
4. 测试Preview和Extract功能
5. 验证提取的内容是否只包含选择的部分

## 🐛 故障排除

### 选择未被检测到
- 确保选择了实际的文本内容（不是空白区域）
- 检查浏览器控制台是否有错误信息
- 尝试重新打开Extension popup

### 选择提取失败
- Extension会自动回退到全页面提取
- 检查选择的内容是否包含有效的HTML元素
- 复杂的选择（跨多个不相关元素）可能导致提取失败

### 元数据缺失
- 选择模式下，标题等元数据来自原页面，不是选择内容
- 如果原页面缺少meta标签，某些字段可能为空

## 📝 注意事项

1. 选择检测每秒进行一次，可能有轻微延迟
2. 选择的内容必须包含实际的HTML元素才能正确提取
3. 跨iframe的选择可能不被支持
4. 某些网站可能限制选择操作，导致功能无法使用 