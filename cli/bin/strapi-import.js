#!/usr/bin/env node

import { Command } from 'commander';
import csv from 'csv-parser';
import fs from 'fs-extra';
import chalk from 'chalk';
import axios from 'axios';
import ProgressBar from 'progress';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// 版本信息
program
  .name('strapi-import')
  .description('Import CSV data to Strapi collections')
  .version('1.0.0');

// 主命令
program
  .argument('<collection>', 'Collection name to import into')
  .argument('<csv-file>', 'CSV file path to import')
  .option('-c, --config <file>', 'Config file path', '.articlerc.json')
  .option('-d, --dry-run', 'Dry run - preview data without importing')
  .option('-b, --batch-size <size>', 'Batch size for imports', '10')
  .option('-v, --verbose', 'Verbose output')
  .option('--skip-errors', 'Skip rows with errors and continue')
  .action(async (collection, csvFile, options) => {
    try {
      await importCsvToStrapi(collection, csvFile, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// 读取配置文件
async function loadConfig(configPath) {
  const fullPath = path.resolve(configPath);
  
  if (!await fs.pathExists(fullPath)) {
    throw new Error(`Config file not found: ${fullPath}`);
  }
  
  try {
    const config = await fs.readJson(fullPath);
    
    // 验证必需的配置
    if (!config.strapiUrl) {
      throw new Error('Missing strapiUrl in config');
    }
    if (!config.token) {
      throw new Error('Missing token in config');
    }
    
    return config;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Config file not found: ${fullPath}`);
    }
    throw new Error(`Invalid config file: ${error.message}`);
  }
}

// 读取CSV文件
async function readCsvFile(csvFile) {
  const fullPath = path.resolve(csvFile);
  
  if (!await fs.pathExists(fullPath)) {
    throw new Error(`CSV file not found: ${fullPath}`);
  }
  
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(fullPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// 验证Strapi连接
async function validateStrapiConnection(config, collection) {
  const url = `${config.strapiUrl}/api/${collection}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return response.status === 200;
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        throw new Error('Invalid API token');
      } else if (status === 404) {
        throw new Error(`Collection '${collection}' not found`);
      } else {
        throw new Error(`API error: ${status} ${error.response.statusText}`);
      }
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to Strapi server');
    } else {
      throw new Error(`Connection error: ${error.message}`);
    }
  }
}

// 处理数据行
function processRow(row, config) {
  const processed = { data: {} };
  
  // 直接使用CSV字段，不应用任何配置中的字段映射或预设值
  processed.data = { ...row };
  
  // 清理空值
  Object.keys(processed.data).forEach(key => {
    if (processed.data[key] === '' || processed.data[key] === null) {
      delete processed.data[key];
    }
  });
  
  return processed;
}

// 根据类型转换值
function convertValueByType(value, type) {
  switch (type) {
    case 'number':
      return Number(value);
    case 'boolean':
      return value === 'true' || value === '1' || value === true;
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

// 创建Strapi条目
async function createStrapiEntry(config, collection, data) {
  const url = `${config.strapiUrl}/api/${collection}`;
  
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// 批量处理
async function processBatch(config, collection, batch, batchIndex, options) {
  const results = [];
  
  for (let i = 0; i < batch.length; i++) {
    const row = batch[i];
    const rowIndex = batchIndex * parseInt(options.batchSize) + i + 1;
    
    try {
      const processedData = processRow(row, config);
      
      if (options.dryRun) {
        results.push({
          success: true,
          row: rowIndex,
          data: processedData
        });
        
        if (options.verbose) {
          console.log(chalk.gray(`Row ${rowIndex}:`), JSON.stringify(processedData, null, 2));
        }
      } else {
        const result = await createStrapiEntry(config, collection, processedData);
        results.push({
          success: true,
          row: rowIndex,
          id: result.data?.id,
          data: processedData
        });
        
        if (options.verbose) {
          console.log(chalk.green(`✓ Row ${rowIndex} imported`), result.data?.id ? `(ID: ${result.data.id})` : '');
        }
      }
    } catch (error) {
      const errorResult = {
        success: false,
        row: rowIndex,
        error: error.message,
        data: row
      };
      
      if (options.skipErrors) {
        results.push(errorResult);
        console.log(chalk.yellow(`⚠ Row ${rowIndex} skipped:`), error.message);
      } else {
        throw new Error(`Row ${rowIndex} failed: ${error.message}`);
      }
    }
  }
  
  return results;
}

// 主导入函数
async function importCsvToStrapi(collection, csvFile, options) {
  console.log(chalk.blue('🚀 Starting CSV import to Strapi...'));
  
  // 加载配置
  console.log(chalk.gray('Loading configuration...'));
  const config = await loadConfig(options.config);
  console.log(chalk.green('✓ Configuration loaded'));
  
  // 验证连接
  console.log(chalk.gray('Validating Strapi connection...'));
  await validateStrapiConnection(config, collection);
  console.log(chalk.green('✓ Strapi connection validated'));
  
  // 读取CSV文件
  console.log(chalk.gray(`Reading CSV file: ${csvFile}`));
  const csvData = await readCsvFile(csvFile);
  console.log(chalk.green(`✓ CSV file loaded: ${csvData.length} rows`));
  
  if (csvData.length === 0) {
    console.log(chalk.yellow('No data to import'));
    return;
  }
  
  // 显示预览
  if (csvData.length > 0) {
    console.log(chalk.cyan('\nCSV Headers:'), Object.keys(csvData[0]).join(', '));
    console.log(chalk.gray('These headers will be used as field names directly (no configuration applied)\n'));
  }
  
  if (options.dryRun) {
    console.log(chalk.yellow('\n🔍 DRY RUN MODE - No data will be imported\n'));
  } else {
    console.log(chalk.cyan(`\n📤 Importing to collection: ${collection}\n`));
  }
  
  // 批量处理
  const batchSize = parseInt(options.batchSize);
  const totalBatches = Math.ceil(csvData.length / batchSize);
  let allResults = [];
  
  // 进度条
  const progressBar = new ProgressBar('Importing [:bar] :current/:total (:percent) :etas', {
    complete: '█',
    incomplete: '░',
    width: 30,
    total: csvData.length
  });
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, csvData.length);
    const batch = csvData.slice(start, end);
    
    try {
      const batchResults = await processBatch(config, collection, batch, i, options);
      allResults = allResults.concat(batchResults);
      progressBar.tick(batch.length);
      
      // 小延迟避免过载
      if (!options.dryRun && i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      progressBar.terminate();
      throw error;
    }
  }
  
  // 结果统计
  const successful = allResults.filter(r => r.success).length;
  const failed = allResults.filter(r => !r.success).length;
  
  console.log(chalk.green(`\n✅ Import completed!`));
  console.log(chalk.gray(`Total rows: ${csvData.length}`));
  console.log(chalk.green(`Successful: ${successful}`));
  
  if (failed > 0) {
    console.log(chalk.red(`Failed: ${failed}`));
    
    if (options.verbose) {
      console.log(chalk.red('\nFailed rows:'));
      allResults.filter(r => !r.success).forEach(result => {
        console.log(chalk.red(`Row ${result.row}: ${result.error}`));
      });
    }
  }
  
  if (options.dryRun) {
    console.log(chalk.yellow('\nThis was a dry run. Use without --dry-run to actually import the data.'));
  }
}

// 处理未捕获的错误
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});

// 解析命令行参数
program.parse(); 