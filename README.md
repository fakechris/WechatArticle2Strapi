# WechatArticle2Strapi

A Chrome extension that converts WeChat articles into entries in a Strapi CMS. This project follows the requirements outlined in [`PRD.md`](PRD.md).

## Features

- **One-click extraction**: Extract WeChat article content with a single click
- **Rich content support**: Preserves formatting, images, and links
- **Flexible field mapping**: Configure custom field mappings for your Strapi collection
- **Image processing**: Downloads and uploads images to Strapi media library
- **Automatic slug generation**: URL-friendly slugs from article titles
- **Content sanitization**: Clean HTML content with configurable options
- **Advanced settings**: Control content length, image limits, and processing options
- **Error handling**: Comprehensive error reporting and validation
- **Easy configuration**: Simple setup through extension options page

## Quick Start

1. **Install the extension**:
   - Clone this repository
   - Open `chrome://extensions` in Chrome
   - Enable Developer mode
   - Click "Load unpacked" and select the project folder

2. **Configure Strapi connection**:
   - Right-click the extension icon → Options
   - Enter your Strapi URL, API token, and collection name
   - Configure field mapping for your collection structure (see [Field Mapping Guide](FIELD_MAPPING_GUIDE.md))

3. **Use the extension**:
   - Navigate to a WeChat article
   - Click the extension icon
   - Review the extracted content
   - Click "Send to Strapi" to upload

## Configuration

### Field Mapping
The extension supports flexible field mapping to accommodate different Strapi collection structures. See the [Field Mapping Guide](FIELD_MAPPING_GUIDE.md) for detailed configuration instructions.

### Advanced Settings
- **Content Max Length**: Limit content size to fit your Strapi field limits
- **Max Images**: Control how many images to process
- **Auto-generate slug**: Create URL-friendly slugs from titles
- **Upload images**: Enable/disable image upload to Strapi media library
- **Clean HTML content**: Remove problematic HTML attributes

## Documentation

- [Field Mapping Guide](FIELD_MAPPING_GUIDE.md) - Configure field mappings for your Strapi collection
- [Strapi Setup Guide](STRAPI_SETUP.md) - Set up your Strapi collection and API tokens
- [Development Guide](DEVELOPMENT.md) - Development and customization instructions
- [Technical Documentation](TECHNICAL.md) - Detailed technical implementation

## Files

- `manifest.json` – Chrome extension manifest.
- `src/content.js` – Extracts article content from WeChat pages.
- `src/background.js` – Handles communication with Strapi.
- `src/popup.html`/`src/popup.js` – Popup UI for one‑click upload.
- `src/options.html`/`src/options.js` – Configuration UI for Strapi settings.

## License

MIT
