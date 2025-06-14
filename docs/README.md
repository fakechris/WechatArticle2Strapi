# WechatArticle2Strapi Documentation

Welcome to the comprehensive documentation for WechatArticle2Strapi - a Chrome extension that converts WeChat articles into entries in a Strapi CMS.

## Directory Structure

### 📋 Guides (`/guides`)
User-facing guides and how-to documentation:
- **QUICK_START_GUIDE.md** - Get started quickly with the extension
- **HEAD_IMAGE_GUIDE.md** - Guide for handling head images
- **ANTI_INJECTION_GUIDE.md** - Security best practices
- **STRAPI_SCHEMA_GUIDE.md** - Strapi schema configuration
- **FIELD_PRESETS_GUIDE.md** - Using field presets
- **FIELD_MAPPING_GUIDE.md** - Field mapping configuration
- **STRAPI_SETUP.md** - Setting up Strapi
- **QUICK_CONFIG.md** - Quick configuration guide

### 🛠️ Development (`/development`)
Development and deployment documentation:
- **DEVELOPMENT.md** - Development environment setup
- **wechat-extraction-fix.md** - WeChat content extraction fixes
- **DEPLOYMENT_GUIDE.md** - Deployment instructions
- **项目重构方案.md** - Project refactoring plan
- **微信文章提取问题完整解决方案.md** - Complete WeChat extraction solution

### 🔧 Technical (`/technical`)
Technical documentation and specifications:
- **TECHNICAL.md** - Technical architecture overview
- **unified-config-system.md** - Unified configuration system
- **ENHANCED_IMAGE_PROCESSING.md** - Image processing enhancements
- **IMAGE_URL_FILTERING_TEST.md** - Image URL filtering tests
- **CSP_FIX.md** - Content Security Policy fixes
- **HEAD_IMG_UPDATE.txt** - Head image update notes
- **HEAD_IMG_UPDATE.md** - Head image update documentation
- **HEAD_IMG_SIZE_CHECK.md** - Head image size checking
- **LAZY_LOADING_FIX_DEPLOYMENT.md** - Lazy loading fix deployment
- **CHROME_EXTENSION_IMAGES_FIX.md** - Chrome extension image fixes
- **IMAGES_FIELD_FEATURE.md** - Images field feature documentation
- **TEST_ENHANCED_FEATURES.md** - Enhanced features testing
- **IMAGE_UPLOAD_TROUBLESHOOTING.md** - Image upload troubleshooting

### 📊 Summaries (`/summaries`)
Project summaries and completion reports:
- **HEAD_IMG_FIX_SUMMARY.md** - Head image fix summary
- **COMPLETION_SUMMARY.md** - Project completion summary
- **ENHANCEMENT_SUMMARY.md** - Enhancement summary
- **FEATURE_SUMMARY.md** - Feature summary
- **重构实施总结.md** - Refactoring implementation summary
- **重构完成总结.md** - Refactoring completion summary
- **SOLUTION-SUMMARY.md** - Solution summary

### 💡 Examples (`/examples`)
Usage examples and demonstrations:
- **USAGE_EXAMPLES.md** - Usage examples and best practices
- **PRESET_DEMO.md** - Preset demonstration
- **RULES_ENGINE_DEMO.md** - Rules engine demonstration

### 🖥️ CLI (`/cli`)
Command Line Interface documentation:
- **CLI_README.md** - CLI tool overview
- **README-V2.md** - CLI version 2 documentation
- **README-IMPORT.md** - Import functionality documentation
- **COMPATIBILITY.md** - Compatibility information
- **HEAD_IMG_SIZE_CHECK_UPDATE.md** - Head image size check updates

## Quick Navigation

- **New Users**: Start with `/guides/QUICK_START_GUIDE.md`
- **Developers**: Check `/development/DEVELOPMENT.md`
- **Technical Details**: Browse `/technical/TECHNICAL.md`
- **Examples**: Explore `/examples/USAGE_EXAMPLES.md`
- **CLI Users**: See `/cli/CLI_README.md`

## Project Overview

This extension allows users to extract articles from WeChat's public platform and automatically create corresponding entries in a Strapi CMS system. The project includes:

- Chrome extension for content extraction
- CLI tools for batch processing
- Comprehensive configuration system
- Image processing capabilities
- Field mapping and presets
- Security features

## Recent Updates

### v0.5.2 (Latest) - Playwright自动化支持
- 新增Playwright浏览器自动化功能
- 支持动态内容提取和复杂页面交互
- 详细技术文档请参考 `/technical/PLAYWRIGHT_INTEGRATION.md`

### v0.5.0 - 重大架构重构
- Chrome扩展与CLI工具统一核心逻辑
- 代码重复减少90%，功能更强大
- 完整重构总结请参考 `/summaries/重构完成总结.md`

For the main project README, see the root directory `README.md`.