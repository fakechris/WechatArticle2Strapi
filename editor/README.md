# WeChat Article Editor

A standalone online markdown WYSIWYG editor optimized for WeChat articles with Strapi CMS integration.

## Features

- **WYSIWYG Editor**: Rich text editor powered by Quill.js
- **Modern Dark/Light Theme**: Beautiful theme toggle with CSS variables and gradients
- **HTML/Markdown Import**: Paste HTML or Markdown content with automatic format detection
- **WeChat Styling**: CSS optimized for WeChat article appearance
- **Live Preview**: Real-time preview with WeChat-style formatting
- **Secure Strapi Integration**: Server-side proxy keeps API tokens secure
- **Auto Slug Generation**: Automatic URL-friendly slug generation with Chinese pinyin support
- **Config File Support**: Load Strapi settings securely from configuration files
- **Node.js Server**: Lightweight full-stack server with API proxy

## Quick Start

### Method 1: One-click Start (Recommended)
```bash
cd editor
./start.sh
```

### Method 2: Start with Config File (Secure)
```bash
cd editor
./start.sh -f ../.articlerc.json    # Load Strapi settings securely
./start.sh -f config.json -p 9000    # Custom port
```

### Method 3: Direct Node.js Server (Recommended for Production)
```bash
cd editor
node server.cjs -f ../.articlerc.json -p 8080
```

### Method 4: Manual Start (Development Only)
```bash
cd editor
python3 -m http.server 8080
# Then open http://localhost:8080
# Note: No Strapi integration available with Python server
```

## Command Line Options

The `start.sh` script supports several options:

- `-f, --config FILE`: Load Strapi configuration from JSON file (.articlerc.json format)
- `-p, --port PORT`: Specify server port (default: 8080)
- `-h, --help`: Show help message

**Example:**
```bash
./start.sh -f ../config.json -p 9000
```

## Usage

1. **Open the Editor**: Start the server and open http://localhost:8080
2. **Configure Strapi**: Click "Settings" to configure your Strapi connection
3. **Choose Upload Method**: Select image upload method (Base64 or Strapi)
4. **Create Content**: Use the editor to write your article or import existing content
5. **Switch Modes**: Toggle between Visual and Source mode as needed
6. **Preview**: Check the WeChat-style preview in real-time
7. **Publish**: Click "Publish to Strapi" to save as a draft in your CMS

## Configuration

### Strapi Settings
- **Base URL**: Your Strapi instance URL (e.g., `http://localhost:1337`)
- **API Token**: Strapi API token with write permissions
- **Collection Name**: Target collection name (default: `articles`)

### Image Upload Options

#### 1. Base64 Mode (No Server Required)
- **Pros**: Works offline, no server setup needed
- **Cons**: Large file sizes, slower loading
- **Best for**: Small images, testing, offline use

#### 2. Strapi Upload Mode (Recommended)
- **Pros**: Optimized performance, proper media management
- **Cons**: Requires Strapi server
- **Best for**: Production use, large images

### Features
- **Source Code Mode**: Toggle between visual and markdown editing
- **Rich HTML Paste**: Paste content with images from any source
- **Smart Image Processing**: Automatic image extraction and conversion
- Articles are automatically saved as drafts in Strapi v4
- Supports Chinese text with automatic pinyin slug generation
- HTML content is converted to Markdown for storage
- Paste detection automatically converts HTML to formatted content

## File Structure

```
editor/
├── index.html          # Main HTML file
├── styles.css          # WeChat-optimized styles
├── editor.js           # Main editor functionality
├── config.js           # Configuration management
├── strapi-browser.js   # Browser-compatible Strapi integration
└── README.md           # This file
```

## Dependencies

All dependencies are loaded via CDN:
- Quill.js 2.0.2 (WYSIWYG editor)
- Turndown 7.1.2 (HTML to Markdown conversion)
- Marked 9.1.6 (Markdown to HTML conversion)
- Pinyin 2.11.2 (Chinese pinyin conversion for slugs)

## Integration with Main Project

This editor is part of the Enhanced Article Extractor project and uses:
- Compatible Strapi integration with the main project
- Same draft creation strategy as the CLI tool
- Shared configuration approach for seamless integration