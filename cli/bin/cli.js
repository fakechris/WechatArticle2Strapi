#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ArticleExtractor from '../src/extractor.js';
import OutputFormatter from '../src/formatter.js';
import ConfigManager from '../src/config.js';

const program = new Command();

program
  .name('article-extractor')
  .description('Extract articles from web pages with enhanced metadata')
  .version('1.0.0');

program
  .argument('<url>', 'URL of the article to extract (or local file path)')
  .option('-o, --output <path>', 'Output file path (default: console)')
  .option('-f, --format <type>', 'Output format: json, text, html', 'json')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--images', 'Download and process images', false)
  .option('--strapi', 'Send extracted data to Strapi CMS', false)
  .option('--verbose', 'Verbose output', false)
  .option('--max-images <number>', 'Maximum number of images to process', '10')
  .option('--quality <number>', 'Image compression quality (0-1)', '0.8')
  .action(async (url, options) => {
    try {
      // Load configuration
      const config = new ConfigManager(options.config);
      await config.load();

      // Create extractor instance
      const extractor = new ArticleExtractor({
        verbose: options.verbose,
        processImages: options.images,
        maxImages: parseInt(options.maxImages),
        imageQuality: parseFloat(options.quality),
        config: config.get()
      });

      console.log(chalk.blue('🚀 Starting article extraction...'));
      console.log(chalk.gray(`URL: ${url}`));

      // Extract article
      const article = await extractor.extract(url);

      // Send to Strapi if requested
      if (options.strapi) {
        console.log(chalk.blue('📤 Sending to Strapi...'));
        const strapiResult = await extractor.sendToStrapi(article);
        article.strapiResult = strapiResult;
        console.log(chalk.green(`✅ Sent to Strapi (ID: ${strapiResult.data?.id})`));
      }

      // Format and output results
      const formatter = new OutputFormatter(options.format);
      const output = formatter.format(article);

      if (options.output) {
        await formatter.writeToFile(output, options.output);
        console.log(chalk.green(`✅ Output saved to: ${options.output}`));
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