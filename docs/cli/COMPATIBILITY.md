# Chrome Extension ↔ CLI Configuration Compatibility

The Article Extractor CLI is **100% compatible** with the Chrome extension configuration format. You can seamlessly share configurations between both systems.

## ✅ Full Compatibility Confirmed

### What's Compatible

- **🔧 Strapi Settings**: URL, token, collection name
- **🗺️ Field Mapping**: All field mappings and enabled state
- **🎯 Field Presets**: All presets with type conversion (text, number, boolean, json)
- **⚙️ Advanced Settings**: All Chrome extension settings preserved
- **🧹 Cleanup Rules**: Both built-in and custom cleanup rules
- **🖼️ Image Settings**: Compression, quality, head image configuration
- **📊 Enhanced Metadata**: All new metadata fields (siteName, language, tags, etc.)

### Configuration Format

Both systems use the **exact same flat configuration structure**:

```json
{
  "strapiUrl": "https://your-strapi.com",
  "token": "your-api-token",
  "collection": "articles",
  "fieldMapping": {
    "enabled": true,
    "fields": {
      "title": "title",
      "content": "content",
      "headImg": "cover_image"
    }
  },
  "fieldPresets": {
    "enabled": true,
    "presets": {
      "category": { "value": "articles", "type": "text" }
    }
  },
  "advancedSettings": {
    "uploadHeadImg": true,
    "imageQuality": 0.85
  }
}
```

## 🔄 Import/Export Between Systems

### Import Chrome Extension Backup to CLI

```bash
# Import a Chrome extension backup file
node bin/cli.js --import-chrome-backup chrome-backup.json

# The CLI will automatically:
# 1. Validate the backup format
# 2. Convert and merge settings
# 3. Save to .articlerc.json
# 4. Show any warnings
```

### Export CLI Config as Chrome Extension Backup

```bash
# Export current CLI config as Chrome extension backup
node bin/cli.js --export-chrome-backup chrome-backup.json

# Creates a backup file that can be imported into the Chrome extension
```

### Manual File Sharing

You can also manually copy configuration files:

1. **CLI → Chrome Extension**: Copy `.articlerc.json` content to Chrome extension's "Restore Settings"
2. **Chrome Extension → CLI**: Copy Chrome backup content to `.articlerc.json`

## 📋 Configuration Validation

### Automatic Validation

Both systems automatically validate configurations:

```bash
# Check if current CLI config is Chrome-compatible
node bin/cli.js --verbose  # Shows compatibility status

# Import validates Chrome backups automatically
node bin/cli.js --import-chrome-backup backup.json
```

### Validation Checks

- ✅ Required fields present (strapiUrl, token, collection)
- ✅ Field mapping structure is valid
- ✅ Field presets have correct type definitions
- ✅ Advanced settings use correct data types
- ✅ Custom cleanup rules are properly formatted

## 🔀 Migration Examples

### Example 1: Chrome Extension → CLI

```bash
# 1. Export backup from Chrome extension (Options → Backup Settings)
# 2. Import into CLI
node bin/cli.js --import-chrome-backup wechat-extractor-backup.json

# 3. Use immediately
node bin/cli.js "https://mp.weixin.qq.com/s/example" --strapi --verbose
```

### Example 2: CLI → Chrome Extension

```bash
# 1. Export from CLI
node bin/cli.js --export-chrome-backup for-chrome.json

# 2. Import into Chrome extension (Options → Restore Settings)
# 3. All your field mappings and presets are preserved
```

### Example 3: Shared Team Configuration

```bash
# Team lead creates configuration
node bin/cli.js --generate-config
# Edit .articlerc.json with team settings

# Export for Chrome extension users
node bin/cli.js --export-chrome-backup team-config.json

# Share team-config.json with Chrome extension users
# CLI users can copy .articlerc.json directly
```

## 📁 File Formats

### Chrome Extension Backup Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0",
  "settings": {
    "strapiUrl": "https://my-strapi.com",
    "fieldMapping": { ... },
    "advancedSettings": { ... }
  }
}
```

### CLI Configuration Format

```json
{
  "strapiUrl": "https://my-strapi.com",
  "fieldMapping": { ... },
  "advancedSettings": { ... },
  "_cliSettings": {
    "extraction": { ... },
    "output": { ... }
  }
}
```

> **Note**: CLI adds `_cliSettings` for CLI-specific features, but Chrome extension settings remain identical.

## 🛠️ Advanced Usage

### Environment Variables

Both systems support the same environment variables:

```bash
export STRAPI_URL="https://my-strapi.com"
export STRAPI_TOKEN="abc123"
export STRAPI_COLLECTION="articles"

# Works for both CLI and Chrome extension
```

### Field Mapping Compatibility

All field types are compatible:

- **Text fields**: `title`, `content`, `author`, `digest`
- **DateTime fields**: `publishTime`, `extractedAt`
- **JSON fields**: `tags`, `images`
- **Media fields**: `headImg` (cover image)
- **UID fields**: `slug`

### Field Presets Compatibility

All preset types work in both systems:

```json
{
  "fieldPresets": {
    "enabled": true,
    "presets": {
      "category": { "value": "Blog Posts", "type": "text" },
      "priority": { "value": 5, "type": "number" },
      "featured": { "value": true, "type": "boolean" },
      "metadata": { "value": "{\"source\":\"cli\"}", "type": "json" }
    }
  }
}
```

## 🧪 Testing Compatibility

Run the compatibility test suite:

```bash
node test-compatibility.js
```

This verifies:
- ✅ Chrome → CLI conversion preserves all data
- ✅ CLI → Chrome conversion works correctly
- ✅ Round-trip conversion maintains integrity
- ✅ All field mappings and presets are preserved
- ✅ Validation catches configuration errors

## 🎯 Best Practices

### 1. Version Control Configuration

```bash
# Store team configuration in git
git add .articlerc.json
git commit -m "Add team Strapi configuration"

# Team members can use directly or convert for Chrome extension
node bin/cli.js --export-chrome-backup team-chrome-config.json
```

### 2. Environment-Specific Configs

```bash
# Development
STRAPI_URL="http://localhost:1337" node bin/cli.js "..." --strapi

# Production (using config file)
node bin/cli.js "..." --strapi -c production.articlerc.json
```

### 3. Backup Before Changes

```bash
# Always backup before making major configuration changes
node bin/cli.js --export-chrome-backup backup-$(date +%Y%m%d).json
```

## 🔧 Troubleshooting

### Common Issues

1. **Import fails with "Invalid backup format"**
   ```bash
   # Ensure the backup is valid JSON and has the correct structure
   cat backup.json | jq .  # Validate JSON syntax
   ```

2. **Field mapping not working**
   ```bash
   # Check field names match your Strapi collection schema
   node bin/cli.js --verbose  # Shows detailed field mapping info
   ```

3. **Presets not applying**
   ```bash
   # Verify preset types match Strapi field types
   # text → Text field
   # number → Number/Integer field  
   # boolean → Boolean field
   # json → JSON field
   ```

### Debug Mode

```bash
# Enable verbose logging for detailed compatibility info
node bin/cli.js "https://example.com" --strapi --verbose

# Shows:
# - Configuration validation results
# - Field mapping details
# - Preset application status
# - Chrome extension compatibility status
```

## 📞 Support

For compatibility issues:

1. **Run compatibility test**: `node test-compatibility.js`
2. **Check verbose output**: Use `--verbose` flag
3. **Validate configuration**: Both systems show validation errors
4. **Compare configurations**: Use export/import to see differences

The CLI and Chrome extension are designed to work identically - any configuration that works in one will work in the other!