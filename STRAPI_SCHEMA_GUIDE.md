# Strapi Collection Schema Setup Guide

## 1. Create Collection Type "Articles"

Go to **Content-Type Builder** → **Create new collection type** → Name: `articles`

## 2. Required Fields

### Core Fields
```javascript
{
  // Required basic fields
  title: {
    type: 'text',
    required: true,
    maxLength: 255
  },
  content: {
    type: 'richtext', // or 'text' for plain HTML
    required: true
  },
  
  // Optional metadata fields
  author: {
    type: 'text',
    maxLength: 100
  },
  publishTime: {
    type: 'text', // or 'datetime' if you want structured dates
    maxLength: 100
  },
  digest: {
    type: 'text',
    maxLength: 500
  },
  sourceUrl: {
    type: 'text',
    maxLength: 1000
  },
  slug: {
    type: 'uid',
    targetField: 'title' // Auto-generate from title
  }
}
```

### Enhanced Metadata Fields (New!)
```javascript
{
  // Enhanced metadata inspired by Obsidian Clipper
  siteName: {
    type: 'text',
    maxLength: 100
  },
  language: {
    type: 'text',
    maxLength: 10
  },
  tags: {
    type: 'json' // Will store array of tags
  },
  readingTime: {
    type: 'integer' // Reading time in minutes
  },
  extractedAt: {
    type: 'datetime' // When content was extracted
  }
}
```

### Image Fields
```javascript
{
  // Option 1: Store images as JSON array (simple)
  images: {
    type: 'json' // Array of image objects with src, alt, etc.
  },
  
  // Option 2: Head image as media field (recommended)
  head_img: {
    type: 'media',
    multiple: false,
    allowedTypes: ['images']
  }
}
```

### Advanced Fields (Optional)
```javascript
{
  // For Dynamic Zone support
  blocks: {
    type: 'dynamiczone',
    components: ['blocks.rich-text', 'blocks.image', 'blocks.quote']
  }
}
```

## 3. Get API Token

1. Go to **Settings** → **API Tokens** → **Create new API Token**
2. **Name**: Article Extractor
3. **Type**: Full access (or Custom with read/write permissions)
4. **Duration**: Unlimited
5. **Copy the token** (you won't see it again!)

## 4. Set Permissions

Go to **Settings** → **Users & Permissions** → **Roles** → **Public** (or your role):

- ✅ **Upload**: `create`, `upload`
- ✅ **Articles** (your collection): `create`, `find`, `findOne`

## 5. Chrome Extension Field Mapping

Map the extracted fields to your Strapi fields:

### Basic Mapping
```
Title → title
Content → content  
Author → author
Publish Time → publishTime
Digest → digest
Source URL → sourceUrl
Slug → slug
Head Image → head_img
```

### Enhanced Metadata Mapping
```
Site Name → siteName
Language → language
Tags/Keywords → tags
Reading Time → readingTime
Created At → extractedAt
```

## 6. Example API Response

After successful upload, you'll get:

```json
{
  "data": {
    "id": 123,
    "attributes": {
      "title": "人工智能技术发展趋势分析",
      "content": "<article>...</article>",
      "author": "技术专家",
      "siteName": "微信公众号",
      "language": "zh-CN",
      "tags": ["AI", "技术", "趋势"],
      "readingTime": 8,
      "head_img": {
        "data": {
          "id": 456,
          "attributes": {
            "url": "/uploads/head_img_789.jpg"
          }
        }
      }
    }
  }
}
```

## 7. Troubleshooting

### Common Issues:
- **401 Unauthorized**: Check API token and permissions
- **400 Bad Request**: Check field mapping and required fields
- **413 Payload Too Large**: Reduce content length or enable compression
- **Validation Error**: Ensure field types match (text vs richtext vs json)

### Debug Tips:
- Use "Show Current Settings" in extension options
- Enable verbose logging in browser console
- Test with simple articles first
- Check Strapi logs for detailed error messages