#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ArticleExtractor from '../src/extractor.js';
import OutputFormatter from '../src/formatter.js';
import ConfigManager from '../src/config.js';

const program = new Command();

program
  .name('article-extractor')
  .description('Extract articles from web pages with enhanced metadata and Strapi integration')
  .version('1.0.0');

program
  .argument('<url>', 'URL of the article to extract (or local file path)')
  .option('-o, --output <path>', 'Output file path (default: console)')
  .option('-f, --format <type>', 'Output format: json, text, html, markdown', 'json')
  .option('-c, --config <path>', 'Path to configuration file (.articlerc.json)')
  .option('--images', 'Download and process images locally', false)
  .option('--strapi', 'Send extracted data to Strapi CMS with full integration', false)
  .option('--upload-images', 'Upload images to Strapi media library (requires --strapi)', false)
  .option('--head-image', 'Upload head/cover image to Strapi (requires --strapi)', false)
  .option('--head-image-index <number>', 'Index of image to use as head image (0 = first)', '0')
  .option('--verbose', 'Verbose output with detailed processing logs', false)
  .option('--max-images <number>', 'Maximum number of images to process', '10')
  .option('--quality <number>', 'Image compression quality (0-1)', '0.8')
  .option('--generate-config', 'Generate example configuration file', false)
  .option('--import-chrome-backup <path>', 'Import Chrome extension backup file')
  .option('--export-chrome-backup <path>', 'Export current config as Chrome extension backup')
  .action(async (url, options) => {
    try {
      // Handle config generation
      if (options.generateConfig) {
        const config = new ConfigManager(options.config);
        const configPath = await config.createTemplate();
        console.log(chalk.green(`✅ Example configuration created at: ${configPath}`));
        console.log(chalk.blue('\n📖 Edit the configuration file to set your Strapi settings:'));
        console.log(chalk.gray('  - strapiUrl: Your Strapi instance URL'));
        console.log(chalk.gray('  - token: Your API token from Strapi admin'));
        console.log(chalk.gray('  - collection: Name of your Strapi collection'));
        console.log(chalk.gray('  - fieldMapping: Map article fields to your Strapi fields'));
        return;
      }

      // Handle Chrome extension backup import
      if (options.importChromeBackup) {
        const config = new ConfigManager(options.config);
        const result = await config.loadFromChromeBackup(options.importChromeBackup);
        await config.save();
        
        console.log(chalk.green('✅ Chrome extension backup imported successfully!'));
        console.log(chalk.gray(`  Backup timestamp: ${result.timestamp}`));
        
        if (result.warnings.length > 0) {
          console.log(chalk.yellow('\n⚠️ Warnings:'));
          result.warnings.forEach(warning => {
            console.log(chalk.yellow(`  • ${warning}`));
          });
        }
        
        console.log(chalk.blue(`\n📝 Configuration saved to: ${config.configPath}`));
        console.log(chalk.blue('🚀 You can now use --strapi to send articles to your configured Strapi instance'));
        return;
      }

      // Handle Chrome extension backup export
      if (options.exportChromeBackup) {
        const config = new ConfigManager(options.config);
        await config.load();
        
        const result = await config.exportAsChromeBackup(options.exportChromeBackup);
        
        console.log(chalk.green('✅ Chrome extension backup exported successfully!'));
        console.log(chalk.gray(`  Export path: ${result.path}`));
        console.log(chalk.gray(`  Timestamp: ${result.timestamp}`));
        console.log(chalk.blue('\n📥 You can now import this backup into the Chrome extension'));
        return;
      }

      // Load configuration
      const config = new ConfigManager(options.config);
      const configLoaded = await config.load();
      
      if (!configLoaded && options.strapi) {
        console.log(chalk.yellow('⚠️ No configuration file found. Creating template...'));
        const configPath = await config.createTemplate();
        console.log(chalk.yellow(`📝 Please edit ${configPath} with your Strapi settings before using --strapi`));
        process.exit(1);
      }

      // Override config with CLI options
      const configData = config.get();
      if (options.uploadImages || options.headImage) {
        configData.advancedSettings = configData.advancedSettings || {};
        configData.advancedSettings.uploadImages = options.uploadImages;
        configData.advancedSettings.uploadHeadImg = options.headImage;
        configData.advancedSettings.headImgIndex = parseInt(options.headImageIndex);
      }

      // Create extractor instance
      const extractor = new ArticleExtractor({
        verbose: options.verbose,
        processImages: options.images,
        maxImages: parseInt(options.maxImages),
        imageQuality: parseFloat(options.quality),
        config: configData
      });

      console.log(chalk.blue('🚀 Starting article extraction...'));
      console.log(chalk.gray(`URL: ${url}`));
      
      if (options.verbose) {
        console.log(chalk.gray('Settings:'));
        console.log(chalk.gray(`  Config: ${configLoaded ? '✅ Loaded' : '❌ Using defaults'}`));
        console.log(chalk.gray(`  Images: ${options.images ? '✅ Process locally' : '❌ Skip'}`));
        console.log(chalk.gray(`  Strapi: ${options.strapi ? '✅ Enabled' : '❌ Disabled'}`));
        if (options.strapi) {
          console.log(chalk.gray(`  Upload Images: ${options.uploadImages ? '✅ Yes' : '❌ No'}`));
          console.log(chalk.gray(`  Head Image: ${options.headImage ? `✅ Index ${options.headImageIndex}` : '❌ No'}`));
        }
      }

      // Extract article
      const article = await extractor.extract(url);

      // Send to Strapi if requested
      if (options.strapi) {
        console.log(chalk.blue('\n📤 Sending to Strapi...'));
        
        // Validate Strapi configuration
        const validation = config.validate();
        if (!validation.valid) {
          console.error(chalk.red('❌ Strapi configuration errors:'));
          validation.errors.forEach(error => {
            console.error(chalk.red(`  • ${error}`));
          });
          process.exit(1);
        }
        
        try {
          const strapiResult = await extractor.sendToStrapi(article);
          article.strapiResult = strapiResult;
          
          console.log(chalk.green('✅ Successfully sent to Strapi!'));
          console.log(chalk.green(`  Article ID: ${strapiResult.data?.id}`));
          
          if (article.headImageInfo) {
            console.log(chalk.green(`  Head Image: ${article.headImageInfo.filename} (ID: ${article.headImageInfo.id})`));
          }
          
          if (article.imageProcessingStats) {
            const stats = article.imageProcessingStats;
            console.log(chalk.green(`  Images: ${stats.successful}/${stats.total} uploaded successfully`));
          }
          
        } catch (strapiError) {
          console.error(chalk.red('❌ Strapi error:'), strapiError.message);
          if (options.verbose) {
            console.error(chalk.gray(strapiError.stack));
          }
          process.exit(1);
        }
      }

      // Format and output results
      const formatter = new OutputFormatter(options.format);
      const output = formatter.format(article);

      if (options.output) {
        await formatter.writeToFile(output, options.output);
        console.log(chalk.green(`\n✅ Output saved to: ${options.output}`));
      } else {
        console.log('\n' + chalk.yellow('📄 Extracted Article:'));
        console.log(output);
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      if (options.verbose) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program.parse();