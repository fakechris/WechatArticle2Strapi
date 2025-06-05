# Quick Configuration for Your Strapi Structure

Based on your Strapi Article collection structure, here's the fastest way to get started:

## Your Collection Fields
- `title` (Text)
- `description` (Text)  
- `slug` (UID)
- `cover` (Media)
- `author` (Relation)
- `category` (Relation)
- `blocks` (Dynamic zone)

## Recommended Extension Settings

### 1. Basic Configuration
```
Strapi URL: https://your-strapi-url.com
Collection Name: articles
API Token: [your-api-token]
```

### 2. Field Mapping (推荐配置 - 适配80字符限制)
```
Title → title
Content → (leave completely empty - no text)
Author → (leave completely empty - no text)
Publish Time → (leave completely empty - no text)
Digest → description  (使用摘要作为描述，符合80字符限制)
Source URL → (leave completely empty - no text)
Images → (leave completely empty - no text)
Slug → slug
```

**重要**: 对于不需要的字段，请确保输入框完全为空（不要输入任何文字），这样这些字段就不会被发送到Strapi。

### 3. Advanced Settings
```
✅ Auto-generate slug from title
❌ Upload images to Strapi
✅ Clean HTML content
✅ Include blocks field (for Dynamic Zone)
✅ Put article content in first blocks item
Blocks Component Name: blocks.rich-text
Content Max Length: 50000
Max Images: 10
```

## Why This Configuration?

- **Title → title**: WeChat article titles go to your title field
- **Content → description**: WeChat article content goes to your description field  
- **Slug → slug**: Auto-generated URL-friendly slugs from titles
- **Images disabled**: Since your cover field is Media type, we skip automatic image uploads
- **Relations skipped**: Author and category need to be assigned manually in Strapi admin

## Testing Steps

1. **Save the configuration** in extension settings
2. **Test connection** (should show success)
3. **Try with a short WeChat article first**
4. **Check Strapi admin** to see the imported article
5. **Manually assign author/category** in Strapi admin if needed

## Next Steps

- See [FIELD_MAPPING_GUIDE.md](FIELD_MAPPING_GUIDE.md) for advanced configurations
- See [STRAPI_SETUP.md](STRAPI_SETUP.md) for collection setup details
- If you want to use all features, consider adding these optional fields to your collection:
  - `sourceUrl` (Text) - for WeChat article URLs
  - `publishTime` (Text) - for article publish dates
  - `importedAt` (DateTime) - for import timestamps 