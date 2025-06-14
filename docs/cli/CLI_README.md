# Article Extractor CLI

A Node.js command-line interface for extracting articles from web pages with enhanced metadata. This CLI tool replicates the functionality of the Enhanced Article Extractor Chrome extension for server-side use.

## Features

- **Advanced Content Extraction**: Uses the Defuddle library (same as Obsidian Clipper) for high-quality content filtering
- **Enhanced Metadata Collection**: Extracts title, author, publish date, tags, reading time, and more
- **Multi-Platform Support**: Optimized for WeChat articles, Zhihu, CSDN, Jianshu, and general web pages
- **Image Processing**: Download, compress, and process article images
- **Multiple Output Formats**: JSON, Text, HTML, and Markdown
- **Strapi Integration**: Direct upload to Strapi CMS
- **Configurable**: Flexible configuration via files or environment variables

## Installation

```bash
# Clone the repository
cd WechatArticle2Strapi/cli

# Install dependencies (if not already installed)
npm install

# Make CLI globally available
npm link
```

## Quick Start

```bash
# Basic extraction
article-extractor https://example.com/article

# Extract with images
article-extractor https://example.com/article --images

# Save to file
article-extractor https://example.com/article -o article.json

# Send to Strapi
article-extractor https://example.com/article --strapi

# Verbose output
article-extractor https://example.com/article --verbose
```

## Usage

```
article-extractor <url> [options]

Arguments:
  url                     URL of the article to extract

Options:
  -o, --output <path>     Output file path (default: console)
  -f, --format <type>     Output format: json, text, html, markdown (default: "json")
  -c, --config <path>     Path to configuration file
  --images                Download and process images (default: false)
  --strapi                Send extracted data to Strapi CMS (default: false)
  --verbose               Verbose output (default: false)
  --max-images <number>   Maximum number of images to process (default: "10")
  --quality <number>      Image compression quality (0-1) (default: "0.8")
  -h, --help              display help for command
```

## Configuration

### Configuration File

Create a `.articlerc.json` file in your project root or home directory:

```json
{
  "strapi": {
    "strapiUrl": "https://your-strapi-instance.com",
    "token": "your-api-token",
    "collection": "articles"
  },
  "extraction": {
    "timeout": 30000,
    "maxContentLength": 50000,
    "generateSlug": true
  },
  "images": {
    "enabled": false,
    "outputDir": "./images",
    "maxImages": 10,
    "imageQuality": 0.8,
    "maxWidth": 1200,
    "maxHeight": 800
  },
  "output": {
    "defaultFormat": "json",
    "verbose": false
  }
}
```

### Environment Variables

```bash
export STRAPI_URL="https://your-strapi-instance.com"
export STRAPI_TOKEN="your-api-token"
export STRAPI_COLLECTION="articles"
export MAX_IMAGES=10
export IMAGE_QUALITY=0.8
```

## Examples

### Extract WeChat Article

```bash
article-extractor "https://mp.weixin.qq.com/s/example" --verbose
```

### Process Images and Save as HTML

```bash
article-extractor "https://example.com/article" --images --format html -o article.html
```

### Send to Strapi with Configuration

```bash
article-extractor "https://example.com/article" --strapi --config ./my-config.json
```

### Batch Processing

```bash
# Extract multiple URLs
for url in url1 url2 url3; do
  article-extractor "$url" -o "articles/$(basename "$url").json"
done
```

## Output Formats

### JSON (Default)
Complete structured data including metadata, content, and extraction statistics.

### Text
Human-readable plain text format with structured sections.

### HTML
Formatted HTML document ready for web display.

### Markdown
Markdown format suitable for documentation or static site generators.

## Supported Platforms

| Platform | Support Level | Features |
|----------|---------------|----------|
| **WeChat Articles** | ⭐⭐⭐⭐⭐ | Specialized extraction with enhanced metadata |
| **Zhihu, CSDN, Jianshu** | ⭐⭐⭐⭐ | Platform-specific cleanup rules |
| **General Web Pages** | ⭐⭐⭐ | Universal content extraction |

## Architecture

The CLI is built with modular components:

- **Extractor**: Main extraction engine using Defuddle
- **MetadataExtractor**: Enhanced metadata collection
- **ImageProcessor**: Image download and compression
- **CleanupRules**: Platform-specific noise removal
- **OutputFormatter**: Multiple output format support
- **ConfigManager**: Configuration file and environment variable handling

## API Reference

### ArticleExtractor

```javascript
const ArticleExtractor = require('./src/extractor');

const extractor = new ArticleExtractor({
  verbose: true,
  processImages: true,
  maxImages: 10
});

const article = await extractor.extract('https://example.com/article');
```

### ConfigManager

```javascript
const ConfigManager = require('./src/config');

const config = new ConfigManager('./config.json');
await config.load();

console.log(config.get('strapi.url'));
config.set('images.enabled', true);
await config.save();
```

## Error Handling

The CLI provides detailed error messages and supports verbose mode for debugging:

```bash
# Enable verbose output for debugging
article-extractor https://example.com --verbose

# Check configuration
article-extractor --help
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see the parent project's LICENSE file for details.

## Related

- [Enhanced Article Extractor Chrome Extension](../README.md)
- [Defuddle Library](https://github.com/kepano/defuddle)
- [Strapi CMS](https://strapi.io/)