# CSP 错误修复说明

## 问题描述

遇到以下Content Security Policy (CSP)错误：
```
Refused to execute inline event handler because it violates the following Content Security Policy directive: "script-src 'self'"
```

## 问题原因

在 `addPresetFieldRow` 函数中使用了内联事件处理器：
```html
<button type="button" class="remove-btn" onclick="removePresetFieldRow(this)">Remove</button>
```

Chrome扩展的CSP策略不允许内联脚本执行，包括 `onclick` 等内联事件处理器。

## 解决方案

### 1. 移除内联事件处理器
将：
```html
<button type="button" class="remove-btn" onclick="removePresetFieldRow(this)">Remove</button>
```

改为：
```html
<button type="button" class="remove-btn">Remove</button>
```

### 2. 使用事件委托
在 `DOMContentLoaded` 事件中添加事件委托：
```javascript
// 使用事件委托处理删除按钮点击（因为按钮是动态生成的）
document.getElementById('presetFieldsList').addEventListener('click', function(event) {
  if (event.target && event.target.classList.contains('remove-btn')) {
    removePresetFieldRow(event.target);
  }
});
```

## 修复的文件

- `src/options.js` - 移除内联onclick，添加事件委托

## 验证修复

1. 重新构建项目：`npm run build`
2. 重新加载扩展
3. 打开设置页面
4. 测试添加/删除预设字段功能

## 最佳实践

在Chrome扩展开发中：
- ❌ 不要使用内联事件处理器（onclick、onload等）
- ✅ 使用 `addEventListener` 绑定事件
- ✅ 对于动态生成的元素，使用事件委托
- ✅ 将所有JavaScript代码放在外部文件中

## 其他可能的CSP问题

如果还遇到其他CSP错误，检查：
1. 内联样式（使用外部CSS）
2. `eval()` 函数使用
3. `javascript:` 协议链接
4. 动态脚本插入

现在预设字段功能应该可以正常工作，没有CSP错误了！ 