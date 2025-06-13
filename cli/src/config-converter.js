/**
 * Configuration Converter
 * Converts between Chrome extension backup format and CLI configuration format
 * Ensures full compatibility between both systems
 */

class ConfigConverter {
  /**
   * Convert Chrome extension backup to CLI configuration
   * @param {Object} chromeBackup - Chrome extension backup object
   * @returns {Object} CLI configuration object
   */
  static chromeBackupToCliConfig(chromeBackup) {
    // Extract settings from backup (backup has: timestamp, settings, version)
    const settings = chromeBackup.settings || chromeBackup;
    
    // Chrome extension format is already flat and compatible
    // Just ensure we have CLI-specific settings
    const cliConfig = {
      ...settings,
      
      // Ensure CLI-specific settings exist
      _cliSettings: settings._cliSettings || {
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

    return cliConfig;
  }

  /**
   * Convert CLI configuration to Chrome extension format
   * @param {Object} cliConfig - CLI configuration object
   * @returns {Object} Chrome extension compatible object
   */
  static cliConfigToChromeBackup(cliConfig) {
    // Remove CLI-specific settings for Chrome extension compatibility
    const { _cliSettings, ...chromeSettings } = cliConfig;
    
    // Create backup format
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      settings: chromeSettings
    };

    return backup;
  }

  /**
   * Validate configuration compatibility
   * @param {Object} config - Configuration object to validate
   * @returns {Object} Validation result with errors if any
   */
  static validateCompatibility(config) {
    const errors = [];
    const warnings = [];

    // Check required Chrome extension fields
    const requiredFields = [
      'strapiUrl',
      'token', 
      'collection',
      'fieldMapping',
      'fieldPresets',
      'advancedSettings'
    ];

    requiredFields.forEach(field => {
      if (!(field in config)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Check field mapping structure
    if (config.fieldMapping) {
      if (typeof config.fieldMapping.enabled !== 'boolean') {
        errors.push('fieldMapping.enabled must be boolean');
      }
      if (!config.fieldMapping.fields || typeof config.fieldMapping.fields !== 'object') {
        errors.push('fieldMapping.fields must be an object');
      }
    }

    // Check field presets structure
    if (config.fieldPresets) {
      if (typeof config.fieldPresets.enabled !== 'boolean') {
        errors.push('fieldPresets.enabled must be boolean');
      }
      if (!config.fieldPresets.presets || typeof config.fieldPresets.presets !== 'object') {
        errors.push('fieldPresets.presets must be an object');
      }
    }

    // Check advanced settings
    if (config.advancedSettings) {
      const numericFields = ['maxContentLength', 'maxImages', 'imageQuality', 'maxImageWidth', 'maxImageHeight', 'headImgIndex'];
      numericFields.forEach(field => {
        if (config.advancedSettings[field] !== undefined && typeof config.advancedSettings[field] !== 'number') {
          errors.push(`advancedSettings.${field} must be a number`);
        }
      });

      const booleanFields = ['generateSlug', 'uploadImages', 'sanitizeContent', 'uploadHeadImg', 'enableImageCompression', 'smartImageReplace', 'retryFailedImages'];
      booleanFields.forEach(field => {
        if (config.advancedSettings[field] !== undefined && typeof config.advancedSettings[field] !== 'boolean') {
          errors.push(`advancedSettings.${field} must be boolean`);
        }
      });
    }

    // Check CLI-specific settings (warnings only)
    if (!config._cliSettings) {
      warnings.push('No CLI-specific settings found - using defaults');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Migrate old configuration formats to current format
   * @param {Object} config - Configuration to migrate
   * @returns {Object} Migrated configuration
   */
  static migrateConfig(config) {
    // Handle nested strapi configuration (old CLI format)
    if (config.strapi && typeof config.strapi === 'object') {
      const migratedConfig = {
        ...config,
        strapiUrl: config.strapi.strapiUrl || config.strapiUrl,
        token: config.strapi.token || config.token,
        collection: config.strapi.collection || config.collection
      };
      
      // Remove old nested strapi object
      delete migratedConfig.strapi;
      
      return migratedConfig;
    }

    return config;
  }

  /**
   * Create a complete Chrome extension compatible backup from CLI config
   * @param {Object} cliConfig - CLI configuration
   * @param {Object} metadata - Optional metadata
   * @returns {Object} Complete backup object
   */
  static createChromeBackup(cliConfig, metadata = {}) {
    const chromeSettings = this.cliConfigToChromeBackup(cliConfig).settings;
    
    return {
      timestamp: new Date().toISOString(),
      version: '1.0',
      settings: chromeSettings,
      metadata: {
        source: 'CLI',
        ...metadata
      }
    };
  }

  /**
   * Extract Chrome extension settings from backup file
   * @param {Object} backupData - Raw backup file data
   * @returns {Object} Extracted settings
   */
  static extractChromeSettings(backupData) {
    // Handle different backup formats
    if (backupData.settings) {
      return backupData.settings;
    }
    
    // If it's just the settings object directly
    if (backupData.strapiUrl || backupData.fieldMapping) {
      return backupData;
    }
    
    throw new Error('Invalid backup format - no settings found');
  }
}

export default ConfigConverter;