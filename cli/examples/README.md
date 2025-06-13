# Configuration Examples

This directory contains example configuration files for the Article Extractor CLI.

## Files

### `basic-config.json`
A basic configuration with default field mapping and standard settings. Good starting point for most use cases.

**Key features:**
- Default field mapping (disabled by default)
- Standard image processing settings
- Basic Strapi integration

### `wechat-config.json`
Optimized configuration for WeChat article extraction with custom field mapping and presets.

**Key features:**
- Custom field mapping for WeChat articles
- Field presets for categorization
- Enhanced image processing (up to 20 images)
- Head image upload enabled
- Higher quality image compression

## Usage

1. Copy one of these files to your project directory:
   ```bash
   cp examples/basic-config.json .articlerc.json
   ```

2. Edit the configuration file with your Strapi settings:
   ```json
   {
     "strapi": {
       "strapiUrl": "https://your-strapi-instance.com",
       "token": "your-api-token-here",
       "collection": "articles"
     }
   }
   ```

3. Run the CLI with Strapi integration:
   ```bash
   article-extractor "https://mp.weixin.qq.com/s/example" --strapi --upload-images --head-image --verbose
   ```

## Configuration Options

### Strapi Settings
- `strapiUrl`: Your Strapi instance URL
- `token`: API token from Strapi admin
- `collection`: Name of your Strapi collection (e.g., "articles")

### Field Mapping
- `enabled`: Enable custom field mapping
- `fields`: Map article fields to your Strapi fields

### Field Presets
- `enabled`: Enable automatic field presets
- `presets`: Set default values for specific fields

### Advanced Settings
- `uploadImages`: Upload images to Strapi media library
- `uploadHeadImg`: Upload head/cover image
- `headImgIndex`: Which image to use as head image (0 = first)
- `generateSlug`: Auto-generate URL slugs
- `sanitizeContent`: Clean HTML content
- `maxImages`: Maximum number of images to process
- `imageQuality`: Compression quality (0-1)

## Strapi Schema Requirements

Your Strapi collection should have these field types:

```javascript
{
  title: 'text',        // Required
  content: 'richtext',  // Required
  author: 'text',
  publishTime: 'text',
  digest: 'text',
  sourceUrl: 'text',
  slug: 'uid',
  siteName: 'text',
  language: 'text',
  tags: 'json',
  readingTime: 'integer',
  extractedAt: 'datetime',
  head_img: 'media'     // For head image
}
```

## Environment Variables

You can also use environment variables:

```bash
export STRAPI_URL="https://your-strapi-instance.com"
export STRAPI_TOKEN="your-api-token"
export STRAPI_COLLECTION="articles"
```

## Getting Help

Run the CLI with `--help` to see all available options:

```bash
article-extractor --help
```

Generate a configuration template:

```bash
article-extractor --generate-config
```