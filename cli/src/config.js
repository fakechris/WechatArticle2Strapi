import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import ConfigConverter from './config-converter.js';

class ConfigManager {
  constructor(configPath = null) {
    this.configPath = configPath || this.getDefaultConfigPath();
    this.config = this.getDefaultConfig();
  }

  getDefaultConfigPath() {
    // Try multiple locations for config file
    const possiblePaths = [
      './.articlerc.json',
      path.join(os.homedir(), '.articlerc.json'),
      path.join(os.homedir(), '.config', 'article-extractor', 'config.json')
    ];

    // Return the first existing config file, or default to current directory
    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return possiblePaths[0]; // Default to ./.articlerc.json
  }

  getDefaultConfig() {
    // EXACT Chrome extension format for full compatibility
    return {
      // Basic Strapi configuration (flat structure like Chrome extension)
      strapiUrl: '',
      token: '',
      collection: 'articles',

      // Field mapping configuration (matches Chrome extension exactly)
      fieldMapping: {
        enabled: false,
        fields: {
          title: 'title',
          content: 'content',
          author: 'author',
          publishTime: 'publishTime',
          digest: 'digest',
          sourceUrl: 'sourceUrl',
          images: 'images',
          slug: 'slug',
          // Enhanced metadata fields
          siteName: 'siteName',
          language: 'language',
          tags: 'tags',
          readingTime: 'readingTime',
          created: 'extractedAt',
          // Head image field
          headImg: 'head_img'
        }
      },

      // Field presets configuration (matches Chrome extension exactly)
      fieldPresets: {
        enabled: false,
        presets: {
          // Example: category: { value: 'extracted-articles', type: 'text' }
        }
      },

      // Advanced settings (matches Chrome extension exactly)
      advancedSettings: {
        maxContentLength: 50000,
        maxImages: 10,
        generateSlug: true,
        uploadImages: true,
        sanitizeContent: true,
        includeBlocksField: false,
        putContentInBlocks: false,
        blocksComponentName: 'blocks.rich-text',
        // Image processing settings
        enableImageCompression: true,
        imageQuality: 0.8,
        maxImageWidth: 1200,
        maxImageHeight: 800,
        smartImageReplace: true,
        retryFailedImages: true,
        // Head image settings
        uploadHeadImg: false,
        headImgIndex: 0
      },

      // Cleanup rules (matches Chrome extension exactly)
      enableCleanupRules: true,
      customCleanupRules: [],

      // CLI-specific settings (not in Chrome extension)
      _cliSettings: {
        extraction: {
          timeout: 30000,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        images: {
          enabled: false,
          outputDir: './images',
          downloadTimeout: 30000
        },
        output: {
          defaultFormat: 'json',
          verbose: false,
          colorize: true
        }
      }
    };
  }

  async load() {
    try {
      if (await fs.pathExists(this.configPath)) {
        const fileContent = await fs.readFile(this.configPath, 'utf8');
        const userConfig = JSON.parse(fileContent);
        
        // Merge with defaults (deep merge)
        this.config = this.deepMerge(this.getDefaultConfig(), userConfig);
        
        return true;
      } else {
        // Config file doesn't exist, use defaults
        return false;
      }
    } catch (error) {
      throw new Error(`Failed to load config from ${this.configPath}: ${error.message}`);
    }
  }

  async save() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.configPath);
      await fs.ensureDir(dir);
      
      // Write config file
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      
      return true;
    } catch (error) {
      throw new Error(`Failed to save config to ${this.configPath}: ${error.message}`);
    }
  }

  get(key = null) {
    if (key === null) {
      return this.config;
    }

    // Support dot notation (e.g., 'strapi.url')
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  set(key, value) {
    // Support dot notation
    const keys = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  async createTemplate() {
    const templateConfig = {
      ...this.getDefaultConfig(),
      strapi: {
        strapiUrl: 'https://your-strapi-instance.com',
        token: 'your-api-token-here',
        collection: 'articles'
      }
    };

    try {
      await fs.writeFile(this.configPath, JSON.stringify(templateConfig, null, 2), 'utf8');
      return this.configPath;
    } catch (error) {
      throw new Error(`Failed to create config template: ${error.message}`);
    }
  }

  validate() {
    const errors = [];

    // Validate Strapi config (flat structure like Chrome extension)
    if (!this.config.strapiUrl) {
      errors.push('Strapi URL is required');
    } else {
      try {
        new URL(this.config.strapiUrl);
      } catch {
        errors.push('Invalid Strapi URL format');
      }
    }

    if (!this.config.token) {
      errors.push('Strapi API token is required');
    }

    if (!this.config.collection) {
      errors.push('Strapi collection name is required');
    }

    // Validate CLI-specific settings
    if (this.config._cliSettings?.extraction) {
      if (this.config._cliSettings.extraction.timeout && 
          (typeof this.config._cliSettings.extraction.timeout !== 'number' || this.config._cliSettings.extraction.timeout <= 0)) {
        errors.push('Extraction timeout must be a positive number');
      }
    }

    // Validate advanced settings (from Chrome extension)
    if (this.config.advancedSettings) {
      if (this.config.advancedSettings.maxImages && 
          (typeof this.config.advancedSettings.maxImages !== 'number' || this.config.advancedSettings.maxImages <= 0)) {
        errors.push('Max images must be a positive number');
      }

      if (this.config.advancedSettings.imageQuality && 
          (typeof this.config.advancedSettings.imageQuality !== 'number' || 
           this.config.advancedSettings.imageQuality <= 0 || this.config.advancedSettings.imageQuality > 1)) {
        errors.push('Image quality must be between 0 and 1');
      }

      if (this.config.advancedSettings.maxContentLength && 
          (typeof this.config.advancedSettings.maxContentLength !== 'number' || this.config.advancedSettings.maxContentLength <= 0)) {
        errors.push('Max content length must be a positive number');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  deepMerge(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }

  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Environment variable overrides
  loadFromEnv() {
    const envMappings = {
      'STRAPI_URL': 'strapiUrl',
      'STRAPI_TOKEN': 'token',
      'STRAPI_COLLECTION': 'collection',
      'EXTRACTION_TIMEOUT': '_cliSettings.extraction.timeout',
      'MAX_IMAGES': 'advancedSettings.maxImages',
      'IMAGE_QUALITY': 'advancedSettings.imageQuality',
      'OUTPUT_DIR': '_cliSettings.images.outputDir'
    };

    Object.entries(envMappings).forEach(([envVar, configPath]) => {
      const value = process.env[envVar];
      if (value !== undefined) {
        // Try to parse as number or boolean if possible
        let parsedValue = value;
        if (!isNaN(value) && !isNaN(parseFloat(value))) {
          parsedValue = parseFloat(value);
        } else if (value.toLowerCase() === 'true') {
          parsedValue = true;
        } else if (value.toLowerCase() === 'false') {
          parsedValue = false;
        }
        
        this.set(configPath, parsedValue);
      }
    });
  }

  // Get summary of current configuration
  getSummary() {
    const summary = {
      configPath: this.configPath,
      configExists: fs.existsSync(this.configPath),
      strapi: {
        configured: !!(this.config.strapiUrl && this.config.token),
        url: this.config.strapiUrl || 'Not set',
        collection: this.config.collection || 'Not set'
      },
      images: {
        enabled: this.config._cliSettings?.images?.enabled || false,
        outputDir: this.config._cliSettings?.images?.outputDir || './images',
        maxImages: this.config.advancedSettings?.maxImages || 10
      },
      extraction: {
        timeout: this.config._cliSettings?.extraction?.timeout || 30000,
        generateSlug: this.config.advancedSettings?.generateSlug !== false
      },
      fieldMapping: {
        enabled: this.config.fieldMapping?.enabled || false,
        fieldsCount: Object.keys(this.config.fieldMapping?.fields || {}).length
      },
      fieldPresets: {
        enabled: this.config.fieldPresets?.enabled || false,
        presetsCount: Object.keys(this.config.fieldPresets?.presets || {}).length
      }
    };

    return summary;
  }

  // Load from Chrome extension backup file
  async loadFromChromeBackup(backupPath) {
    try {
      const backupContent = await fs.readFile(backupPath, 'utf8');
      const backupData = JSON.parse(backupContent);
      
      // Extract and convert Chrome extension settings
      const chromeSettings = ConfigConverter.extractChromeSettings(backupData);
      const cliConfig = ConfigConverter.chromeBackupToCliConfig(chromeSettings);
      
      // Validate compatibility
      const validation = ConfigConverter.validateCompatibility(cliConfig);
      if (!validation.valid) {
        throw new Error(`Invalid Chrome backup: ${validation.errors.join(', ')}`);
      }
      
      // Apply migrated configuration
      this.config = this.deepMerge(this.getDefaultConfig(), cliConfig);
      
      return {
        success: true,
        warnings: validation.warnings,
        timestamp: backupData.timestamp || 'Unknown'
      };
      
    } catch (error) {
      throw new Error(`Failed to load Chrome backup from ${backupPath}: ${error.message}`);
    }
  }

  // Export current config as Chrome extension backup
  async exportAsChromeBackup(outputPath) {
    try {
      const backup = ConfigConverter.createChromeBackup(this.config, {
        exportedBy: 'Article Extractor CLI',
        exportedAt: new Date().toISOString()
      });
      
      await fs.writeFile(outputPath, JSON.stringify(backup, null, 2), 'utf8');
      
      return {
        success: true,
        path: outputPath,
        timestamp: backup.timestamp
      };
      
    } catch (error) {
      throw new Error(`Failed to export Chrome backup to ${outputPath}: ${error.message}`);
    }
  }

  // Check if configuration is compatible with Chrome extension
  isCompatibleWithChrome() {
    const validation = ConfigConverter.validateCompatibility(this.config);
    return validation;
  }
}

export default ConfigManager;