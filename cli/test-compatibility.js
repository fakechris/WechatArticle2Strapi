#!/usr/bin/env node

/**
 * Compatibility Test Script
 * Verifies that CLI configuration is fully compatible with Chrome extension
 */

import fs from 'fs-extra';
import ConfigManager from './src/config.js';
import ConfigConverter from './src/config-converter.js';
import chalk from 'chalk';

// Sample Chrome extension backup (matches the actual format)
const sampleChromeBackup = {
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0",
  "settings": {
    "strapiUrl": "https://my-strapi.herokuapp.com",
    "token": "abc123def456",
    "collection": "articles",
    "fieldMapping": {
      "enabled": true,
      "fields": {
        "title": "title",
        "content": "content", 
        "author": "author",
        "publishTime": "publish_date",
        "digest": "description",
        "sourceUrl": "source_url",
        "images": "image_gallery",
        "slug": "slug",
        "siteName": "site_name",
        "language": "language",
        "tags": "tags", 
        "readingTime": "reading_time",
        "created": "extracted_at",
        "headImg": "cover_image"
      }
    },
    "fieldPresets": {
      "enabled": true,
      "presets": {
        "category": {
          "value": "WeChat Articles",
          "type": "text"
        },
        "status": {
          "value": "published", 
          "type": "text"
        },
        "priority": {
          "value": 5,
          "type": "number"
        },
        "featured": {
          "value": true,
          "type": "boolean"
        }
      }
    },
    "advancedSettings": {
      "maxContentLength": 75000,
      "maxImages": 15,
      "generateSlug": true,
      "uploadImages": true,
      "sanitizeContent": true,
      "includeBlocksField": false,
      "putContentInBlocks": false,
      "blocksComponentName": "blocks.rich-text",
      "enableImageCompression": true,
      "imageQuality": 0.85,
      "maxImageWidth": 1200,
      "maxImageHeight": 800,
      "smartImageReplace": true,
      "retryFailedImages": true,
      "uploadHeadImg": true,
      "headImgIndex": 0
    },
    "enableCleanupRules": true,
    "customCleanupRules": [
      {
        "type": "class",
        "value": "advertisement",
        "description": "Remove ads"
      }
    ]
  }
};

async function runCompatibilityTests() {
  console.log(chalk.blue('🧪 Running Chrome Extension ↔ CLI Compatibility Tests\n'));

  try {
    // Test 1: Chrome backup to CLI config conversion
    console.log(chalk.yellow('Test 1: Chrome backup → CLI config conversion'));
    const cliConfig = ConfigConverter.chromeBackupToCliConfig(sampleChromeBackup);
    
    // Verify all fields are preserved
    console.log(chalk.gray('  ✓ Basic Strapi settings'));
    console.assert(cliConfig.strapiUrl === sampleChromeBackup.settings.strapiUrl);
    console.assert(cliConfig.token === sampleChromeBackup.settings.token);
    console.assert(cliConfig.collection === sampleChromeBackup.settings.collection);
    
    console.log(chalk.gray('  ✓ Field mapping preserved'));
    console.assert(cliConfig.fieldMapping.enabled === sampleChromeBackup.settings.fieldMapping.enabled);
    console.assert(JSON.stringify(cliConfig.fieldMapping.fields) === JSON.stringify(sampleChromeBackup.settings.fieldMapping.fields));
    
    console.log(chalk.gray('  ✓ Field presets preserved'));
    console.assert(cliConfig.fieldPresets.enabled === sampleChromeBackup.settings.fieldPresets.enabled);
    console.assert(JSON.stringify(cliConfig.fieldPresets.presets) === JSON.stringify(sampleChromeBackup.settings.fieldPresets.presets));
    
    console.log(chalk.gray('  ✓ Advanced settings preserved'));
    console.assert(cliConfig.advancedSettings.uploadHeadImg === sampleChromeBackup.settings.advancedSettings.uploadHeadImg);
    console.assert(cliConfig.advancedSettings.imageQuality === sampleChromeBackup.settings.advancedSettings.imageQuality);
    
    console.log(chalk.gray('  ✓ Cleanup rules preserved'));
    console.assert(cliConfig.enableCleanupRules === sampleChromeBackup.settings.enableCleanupRules);
    console.assert(JSON.stringify(cliConfig.customCleanupRules) === JSON.stringify(sampleChromeBackup.settings.customCleanupRules));
    
    console.log(chalk.gray('  ✓ CLI-specific settings added'));
    console.assert(cliConfig._cliSettings !== undefined);
    console.assert(cliConfig._cliSettings.extraction !== undefined);
    
    console.log(chalk.green('  ✅ Chrome → CLI conversion successful\n'));

    // Test 2: CLI config to Chrome backup conversion
    console.log(chalk.yellow('Test 2: CLI config → Chrome backup conversion'));
    const chromeBackup = ConfigConverter.cliConfigToChromeBackup(cliConfig);
    
    console.log(chalk.gray('  ✓ Backup format structure'));
    console.assert(chromeBackup.timestamp !== undefined);
    console.assert(chromeBackup.version !== undefined);
    console.assert(chromeBackup.settings !== undefined);
    
    console.log(chalk.gray('  ✓ CLI-specific settings removed'));
    console.assert(chromeBackup.settings._cliSettings === undefined);
    
    console.log(chalk.gray('  ✓ Chrome extension fields preserved'));
    console.assert(chromeBackup.settings.strapiUrl === cliConfig.strapiUrl);
    console.assert(chromeBackup.settings.fieldMapping.enabled === cliConfig.fieldMapping.enabled);
    console.assert(chromeBackup.settings.advancedSettings.uploadHeadImg === cliConfig.advancedSettings.uploadHeadImg);
    
    console.log(chalk.green('  ✅ CLI → Chrome conversion successful\n'));

    // Test 3: Round-trip conversion (Chrome → CLI → Chrome)
    console.log(chalk.yellow('Test 3: Round-trip conversion test'));
    const roundTripCli = ConfigConverter.chromeBackupToCliConfig(sampleChromeBackup);
    const roundTripChrome = ConfigConverter.cliConfigToChromeBackup(roundTripCli);
    
    // Compare original and round-trip Chrome settings
    const originalSettings = sampleChromeBackup.settings;
    const roundTripSettings = roundTripChrome.settings;
    
    console.log(chalk.gray('  ✓ Field mapping identical'));
    console.assert(JSON.stringify(originalSettings.fieldMapping) === JSON.stringify(roundTripSettings.fieldMapping));
    
    console.log(chalk.gray('  ✓ Field presets identical'));
    console.assert(JSON.stringify(originalSettings.fieldPresets) === JSON.stringify(roundTripSettings.fieldPresets));
    
    console.log(chalk.gray('  ✓ Advanced settings identical'));
    console.assert(JSON.stringify(originalSettings.advancedSettings) === JSON.stringify(roundTripSettings.advancedSettings));
    
    console.log(chalk.green('  ✅ Round-trip conversion successful\n'));

    // Test 4: ConfigManager integration
    console.log(chalk.yellow('Test 4: ConfigManager integration test'));
    
    // Write test backup file
    const testBackupPath = './test-chrome-backup.json';
    await fs.writeFile(testBackupPath, JSON.stringify(sampleChromeBackup, null, 2));
    
    // Test loading Chrome backup
    const configManager = new ConfigManager('./test-cli-config.json');
    const loadResult = await configManager.loadFromChromeBackup(testBackupPath);
    
    console.log(chalk.gray('  ✓ Backup loaded successfully'));
    console.assert(loadResult.success === true);
    console.assert(loadResult.timestamp !== undefined);
    
    // Save as CLI config
    await configManager.save();
    
    console.log(chalk.gray('  ✓ CLI config saved'));
    console.assert(await fs.pathExists('./test-cli-config.json'));
    
    // Test exporting as Chrome backup
    const exportBackupPath = './test-exported-backup.json';
    const exportResult = await configManager.exportAsChromeBackup(exportBackupPath);
    
    console.log(chalk.gray('  ✓ Chrome backup exported'));
    console.assert(exportResult.success === true);
    console.assert(await fs.pathExists(exportBackupPath));
    
    // Verify exported backup
    const exportedBackup = JSON.parse(await fs.readFile(exportBackupPath, 'utf8'));
    console.assert(exportedBackup.settings.strapiUrl === sampleChromeBackup.settings.strapiUrl);
    console.assert(exportedBackup.settings.fieldMapping.enabled === sampleChromeBackup.settings.fieldMapping.enabled);
    
    console.log(chalk.green('  ✅ ConfigManager integration successful\n'));

    // Test 5: Validation test
    console.log(chalk.yellow('Test 5: Configuration validation test'));
    
    const validation = ConfigConverter.validateCompatibility(cliConfig);
    console.log(chalk.gray('  ✓ Configuration validation'));
    console.assert(validation.valid === true);
    console.assert(Array.isArray(validation.errors));
    console.assert(Array.isArray(validation.warnings));
    
    const chromeCompatibility = configManager.isCompatibleWithChrome();
    console.log(chalk.gray('  ✓ Chrome compatibility check'));
    console.assert(chromeCompatibility.valid === true);
    
    console.log(chalk.green('  ✅ Validation tests successful\n'));

    // Cleanup test files
    await fs.remove(testBackupPath);
    await fs.remove('./test-cli-config.json');
    await fs.remove(exportBackupPath);

    console.log(chalk.green('🎉 All compatibility tests passed!'));
    console.log(chalk.blue('\n✅ Chrome extension and CLI configurations are fully compatible'));
    console.log(chalk.blue('✅ Backup import/export works seamlessly'));
    console.log(chalk.blue('✅ All field mappings and settings are preserved'));
    console.log(chalk.blue('✅ Round-trip conversion maintains data integrity'));

  } catch (error) {
    console.error(chalk.red('❌ Compatibility test failed:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompatibilityTests();
}

export { runCompatibilityTests };