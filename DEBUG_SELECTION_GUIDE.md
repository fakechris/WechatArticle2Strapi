# 选择功能调试指南

## 🐛 问题诊断

如果你发现preview功能仍然处理整个页面而不是选择内容，请按照以下步骤进行调试：

### 步骤1: 检查选择状态

1. 打开测试页面 `test-selection.html`
2. 选择蓝色框中的内容
3. 打开Chrome Extension popup
4. 检查是否显示了 "📋 Selected Content Detected" 区域

**如果没有显示选择区域框:**
- 检查浏览器控制台是否有错误
- 确认已经选择了实际的文本内容
- 等待1-2秒让选择检测生效

### 步骤2: 检查调试信息

1. 打开Chrome开发者工具 (F12)
2. 切换到Console标签
3. 选择页面内容后，点击Preview按钮
4. 观察控制台输出的调试信息

**期望看到的调试信息:**

```
🔍 Preview选择状态检查: {
  selectionStatusElement: true,
  selectionStatusVisible: true,
  checkboxElement: true,
  checkboxChecked: true,
  finalUseSelection: true
}

=== Preview Article Request ===
Tab ID: 123
Use Selection: true

📤 发送FULL_EXTRACT消息到content script...
Extract Mode: 选择区域提取

📨 收到消息: {
  type: "FULL_EXTRACT",
  useSelection: true,
  sender: "Extension"
}

📌 提取模式: 选择区域提取
📌 选择函数: extractFromSelection

🔍 检查选择状态: {
  selection: true,
  rangeCount: 1,
  selectedText: "你选择的内容..."
}

✅ 选择信息获取成功: {
  selectedText: "你选择的内容...",
  selectedLength: 150,
  containerType: 3,
  parentElementTag: "DIV"
}

📋 选择信息: {
  hasSelection: true,
  textLength: 150,
  textPreview: "你选择的内容..."
}
```

### 步骤3: 常见问题排查

#### 问题A: 选择状态未检测到
**症状**: Extension popup中没有显示选择区域
**解决方案**:
1. 确保选择了实际的文本内容，不是空白区域
2. 等待1-2秒让定时检测生效
3. 重新打开Extension popup

#### 问题B: 选择状态检测到但useSelection为false
**症状**: 控制台显示 `finalUseSelection: false`
**解决方案**:
1. 检查 "Extract only selected content" 复选框是否被勾选
2. 确认选择状态区域确实显示了

#### 问题C: 消息传递问题
**症状**: Content script没有收到正确的消息
**解决方案**:
1. 检查content script是否正确加载
2. 在页面上打开开发者工具查看console
3. 确认没有content script错误

#### 问题D: 选择提取失败
**症状**: 看到 "选择提取失败，回退到全页面提取..."
**解决方案**:
1. 检查选择的内容是否包含有效的HTML元素
2. 尝试选择更完整的元素块（如整个段落）
3. 避免跨多个不相关元素的复杂选择

### 步骤4: 手动测试

如果自动检测有问题，你可以手动测试选择功能：

1. 在页面上选择内容
2. 打开浏览器控制台
3. 运行以下代码:

```javascript
// 检查选择状态
const selection = window.getSelection();
console.log('选择状态:', {
  hasSelection: !!selection,
  rangeCount: selection ? selection.rangeCount : 0,
  selectedText: selection ? selection.toString().substring(0, 100) : 'none'
});

// 模拟选择提取
if (selection && selection.rangeCount > 0) {
  const range = selection.getRangeAt(0);
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());
  console.log('选择的HTML内容:', container.innerHTML);
}
```

### 步骤5: 强制使用选择模式

如果检测有问题，你可以强制启用选择模式：

1. 打开Extension popup
2. 在浏览器控制台中运行:

```javascript
// 强制显示选择状态
document.getElementById('selection-status').style.display = 'block';
document.getElementById('selection-info').textContent = 'Manually enabled selection mode';
document.getElementById('use-selection').checked = true;
```

3. 然后点击Preview或Extract按钮

## 🔧 开发者调试

如果你需要修改代码进行调试：

### 在content-unified.js中添加更多日志:

```javascript
function getSelectionInfo() {
  console.log('=== 详细选择检测 ===');
  const selection = window.getSelection();
  console.log('Selection object:', selection);
  console.log('Range count:', selection ? selection.rangeCount : 0);
  
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    console.log('Range details:', {
      startContainer: range.startContainer,
      endContainer: range.endContainer,
      startOffset: range.startOffset,
      endOffset: range.endOffset
    });
  }
  
  // ... 原有逻辑
}
```

### 在popup.js中添加更多检查:

```javascript
function checkPageSelection() {
  console.log('=== 检查页面选择状态 ===');
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]) {
      console.log('当前标签页:', tabs[0].url);
      chrome.tabs.sendMessage(tabs[0].id, { type: 'CHECK_SELECTION' }, response => {
        console.log('选择检查响应:', response);
        // ... 原有逻辑
      });
    }
  });
}
```

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. 浏览器版本和类型
2. Extension版本
3. 测试页面URL
4. 完整的控制台输出
5. 选择的具体内容描述

这些信息将帮助快速定位和解决问题。 