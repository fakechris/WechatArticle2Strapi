import fs from 'fs-extra';
import path from 'path';
import os from 'os';

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
    return {
      // Strapi configuration
      strapi: {
        strapiUrl: '',
        token: '',
        collection: 'articles'
      },

      // Extraction settings
      extraction: {
        timeout: 30000,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        maxContentLength: 50000,
        generateSlug: true
      },

      // Image processing settings
      images: {
        enabled: false,
        outputDir: './images',
        maxImages: 10,
        imageQuality: 0.8,
        maxWidth: 1200,
        maxHeight: 800,
        downloadTimeout: 30000
      },

      // Output settings
      output: {
        defaultFormat: 'json',
        verbose: false,
        colorize: true
      },

      // Custom cleanup rules
      cleanup: {
        enabled: true,
        customRules: []
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

    // Validate Strapi config if enabled
    if (this.config.strapi) {
      if (!this.config.strapi.strapiUrl) {
        errors.push('Strapi URL is required');
      } else {
        try {
          new URL(this.config.strapi.strapiUrl);
        } catch {
          errors.push('Invalid Strapi URL format');
        }
      }

      if (!this.config.strapi.token) {
        errors.push('Strapi API token is required');
      }

      if (!this.config.strapi.collection) {
        errors.push('Strapi collection name is required');
      }
    }

    // Validate extraction settings
    if (this.config.extraction) {
      if (this.config.extraction.timeout && 
          (typeof this.config.extraction.timeout !== 'number' || this.config.extraction.timeout <= 0)) {
        errors.push('Extraction timeout must be a positive number');
      }

      if (this.config.extraction.maxContentLength && 
          (typeof this.config.extraction.maxContentLength !== 'number' || this.config.extraction.maxContentLength <= 0)) {
        errors.push('Max content length must be a positive number');
      }
    }

    // Validate image settings
    if (this.config.images) {
      if (this.config.images.maxImages && 
          (typeof this.config.images.maxImages !== 'number' || this.config.images.maxImages <= 0)) {
        errors.push('Max images must be a positive number');
      }

      if (this.config.images.imageQuality && 
          (typeof this.config.images.imageQuality !== 'number' || 
           this.config.images.imageQuality <= 0 || this.config.images.imageQuality > 1)) {
        errors.push('Image quality must be between 0 and 1');
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
      'STRAPI_URL': 'strapi.strapiUrl',
      'STRAPI_TOKEN': 'strapi.token',
      'STRAPI_COLLECTION': 'strapi.collection',
      'EXTRACTION_TIMEOUT': 'extraction.timeout',
      'MAX_IMAGES': 'images.maxImages',
      'IMAGE_QUALITY': 'images.imageQuality',
      'OUTPUT_DIR': 'images.outputDir'
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
        configured: !!(this.config.strapi?.strapiUrl && this.config.strapi?.token),
        url: this.config.strapi?.strapiUrl || 'Not set',
        collection: this.config.strapi?.collection || 'Not set'
      },
      images: {
        enabled: this.config.images?.enabled || false,
        outputDir: this.config.images?.outputDir || './images',
        maxImages: this.config.images?.maxImages || 10
      },
      extraction: {
        timeout: this.config.extraction?.timeout || 30000,
        generateSlug: this.config.extraction?.generateSlug !== false
      }
    };

    return summary;
  }
}

export default ConfigManager;