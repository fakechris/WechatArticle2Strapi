# Field Mapping Configuration Guide

This guide helps you configure the Chrome extension to match your Strapi collection structure.

## Understanding Field Mapping

Different Strapi instances may have different field names and structures. The field mapping feature allows you to map WeChat article data to your specific Strapi collection fields.

## Your Strapi Collection Structure

Based on your screenshot, your Article collection has these fields:

| Field Name | Type | Description |
|------------|------|-------------|
| `title` | Text | Article title |
| `description` | Text | Article content/description |
| `slug` | UID | URL-friendly identifier |
| `cover` | Media | Cover image |
| `author` | Relation (manyToOne) | Author relationship |
| `category` | Relation (manyToOne) | Category relationship |
| `blocks` | Dynamic zone | Content blocks |

## Recommended Configuration

### 1. Enable Field Mapping
In the Chrome extension settings:
- ✅ Check "Enable custom field mapping"

### 2. Configure Field Mappings

Here's the recommended mapping for your structure:

| WeChat Data | Your Strapi Field | Configuration |
|-------------|-------------------|---------------|
| Title | `title` | `title` |
| Content | `description` | `description` |
| Author | `author` | `author` (leave empty if using relation) |
| Publish Time | Leave empty | (skip if not needed) |
| Digest | Leave empty | (skip if not needed) |
| Source URL | Leave empty | (skip if not needed) |
| Images | Leave empty | (skip if using cover field) |
| Slug | `slug` | `slug` |

### 3. Field Mapping Settings

**In the extension settings page:**

```
Title → description  (NOT title, since your content goes to description)
Content → description
Author → (leave empty if you're using relations)
Publish Time → (leave empty)
Digest → (leave empty)
Source URL → (leave empty)
Images → (leave empty if using cover field)
Slug → slug
```

### 4. Advanced Settings

```
✅ Auto-generate slug from title
❌ Upload images to Strapi (unless you want them as JSON)
✅ Clean HTML content
Content Max Length: 50000
Max Images: 10
```

## Alternative Configurations

### Option 1: Simple Text Fields Only
If you want to keep it simple and only use text fields:

```
Title → title
Content → description
Author → (leave empty)
Slug → slug
```

### Option 2: Full Featured
If you have additional text fields in your collection:

```
Title → title
Content → description
Author → author (if you have a text field for author)
Publish Time → publishTime (if you have this field)
Source URL → sourceUrl (if you have this field)
Slug → slug
```

## Important Notes

### 1. Field Types
- **Text fields**: Can accept any string data
- **Rich Text fields**: Can accept HTML content (like `description`)
- **Relation fields**: Require special handling (see below)
- **UID fields**: Should be URL-friendly (slug generation helps)

### 2. Relation Fields
If you're using relation fields (`author`, `category`), you have two options:

**Option A: Skip Relations**
- Leave relation field mappings empty
- Create articles without author/category
- Manually assign them in Strapi admin later

**Option B: Create Simple Relations**
You would need to modify the extension code to:
1. Create author entries if they don't exist
2. Link articles to authors by ID

### 3. Cover Image
For the `cover` field (Media type), you'd need custom handling since it requires file uploads to Strapi's media library.

## Testing Your Configuration

1. **Start with minimal mapping**:
   - Title → `title`
   - Content → `description`
   - Slug → `slug`

2. **Test with a short article first**

3. **Check Strapi admin** to see if data appears correctly

4. **Gradually add more fields** as needed

## Troubleshooting

### "Invalid key" errors
- Check that field names in mapping exactly match your Strapi collection
- Ensure fields exist and are not restricted

### "Validation failed" errors
- Check field types match expected data
- Verify required fields are included
- Check field length limits

### Content too long
- Reduce "Content Max Length" in settings
- Check if your `description` field has length limits

## Example Strapi Collection Setup

If you want to modify your Strapi collection to work better with the extension:

```javascript
// Suggested fields for optimal compatibility
{
  title: 'text',           // Article title
  content: 'richtext',     // Main content (instead of description)
  author: 'text',          // Simple text author name
  publishTime: 'text',     // Publish time as text
  digest: 'text',          // Article summary
  sourceUrl: 'text',       // Original WeChat URL
  slug: 'uid',             // Auto-generated slug
  images: 'json',          // Image metadata as JSON
  importedAt: 'datetime',  // Import timestamp
}
```

This would allow you to use all extension features with default field names. 