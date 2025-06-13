import axios from 'axios';
import slug from 'slug';
import chalk from 'chalk';

class StrapiIntegration {
  constructor(config, options = {}) {
    this.config = config;
    this.options = {
      verbose: false,
      ...options
    };
  }

  // Content sanitization (matches Chrome extension)
  sanitizeContent(content, maxLength = 50000) {
    if (!content) return '';
    
    // Remove problematic HTML attributes and tags (matches extension logic)
    let sanitized = content
      .replace(/data-[^=]*="[^"]*"/g, '') // Remove data-* attributes
      .replace(/style="[^"]*"/g, '') // Remove style attributes
      .replace(/class="[^"]*"/g, '') // Remove class attributes
      .replace(/id="[^"]*"/g, '') // Remove id attributes
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove style tags
      // Remove extension-related image tags
      .replace(/<img[^>]*src="chrome-extension:\/\/[^"]*"[^>]*>/gi, '') // Chrome extension images
      .replace(/<img[^>]*src="moz-extension:\/\/[^"]*"[^>]*>/gi, '') // Firefox extension images
      .replace(/<img[^>]*src="extension:\/\/[^"]*"[^>]*>/gi, '') // Generic extension images
      .replace(/<img[^>]*src="data:image\/svg\+xml[^"]*"[^>]*>/gi, '') // Inline SVG images
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/\s+/g, ' ') // Merge multiple spaces
      .trim();
    
    // If content is too long, truncate and add ellipsis
    if (sanitized.length > maxLength) {
      // Try to truncate at complete HTML tag
      const truncated = sanitized.substring(0, maxLength);
      const lastCompleteTag = truncated.lastIndexOf('>');
      
      if (lastCompleteTag > maxLength - 1000) {
        sanitized = truncated.substring(0, lastCompleteTag + 1) + '...';
      } else {
        sanitized = truncated + '...';
      }
    }
    
    return sanitized;
  }

  // Generate slug (matches Chrome extension)
  generateSlug(title) {
    if (!title || typeof title !== 'string') return '';
    
    try {
      return slug(title, {
        replacement: '-',
        remove: /[*+~.()'"!:@]/g,
        lower: true,
        strict: false,
        locale: 'zh',
        trim: true
      }).substring(0, 60);
    } catch (error) {
      // Fallback slug generation
      return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60);
    }
  }

  // Validate and format article data (matches Chrome extension logic)
  validateArticleData(article) {
    const errors = [];
    
    // Validate required fields
    if (!article.title || article.title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    if (!article.content || article.content.trim().length === 0) {
      errors.push('Content is required');
    }
    
    // Validate field lengths
    if (article.title && article.title.length > 255) {
      errors.push('Title too long (max 255 characters)');
    }
    
    if (errors.length > 0) {
      throw new Error('Validation failed: ' + errors.join(', '));
    }
    
    // Get configuration
    const fieldMapping = this.config.fieldMapping || { enabled: false, fields: {} };
    const fieldPresets = this.config.fieldPresets || { enabled: false, presets: {} };
    const advancedSettings = this.config.advancedSettings || {};
    
    // Get field mapping
    let fieldMap;
    if (fieldMapping.enabled) {
      fieldMap = fieldMapping.fields;
    } else {
      // Default field mapping
      fieldMap = {
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
      };
    }
    
    if (this.options.verbose) {
      console.log(chalk.blue('🔧 Field mapping configuration:'));
      console.log('  Enabled:', fieldMapping.enabled);
      console.log('  Fields:', fieldMap);
    }
    
    // Build data object
    const data = {};
    
    // Basic fields - title and content are required
    if (fieldMap.title && fieldMap.title.trim()) {
      data[fieldMap.title] = article.title.trim().substring(0, 255);
    }
    
    // Content field - use max length from settings
    if (fieldMap.content && fieldMap.content.trim()) {
      const maxContentLength = advancedSettings.maxContentLength || 50000;
      if (advancedSettings.sanitizeContent) {
        const sanitizedContent = this.sanitizeContent(article.content, maxContentLength);
        data[fieldMap.content] = sanitizedContent;
      } else {
        data[fieldMap.content] = article.content.substring(0, maxContentLength);
      }
    }
    
    // Optional fields - only add if mapped to valid field names
    if (article.author && fieldMap.author && fieldMap.author.trim()) {
      data[fieldMap.author] = article.author.trim().substring(0, 100);
    }
    
    if (article.publishTime && fieldMap.publishTime && fieldMap.publishTime.trim()) {
      data[fieldMap.publishTime] = article.publishTime.trim();
    }
    
    if (article.digest && fieldMap.digest && fieldMap.digest.trim()) {
      const maxLength = fieldMap.digest === 'description' ? 80 : 500;
      data[fieldMap.digest] = article.digest.trim().substring(0, maxLength);
    }
    
    if (article.url && fieldMap.sourceUrl && fieldMap.sourceUrl.trim()) {
      data[fieldMap.sourceUrl] = article.url;
    }
    
    // Images field
    if (article.processedImages && article.processedImages.length > 0 && fieldMap.images && fieldMap.images.trim()) {
      data[fieldMap.images] = article.processedImages;
    }

    // Head image field (media type, stores media file ID)
    if (article.headImageId && fieldMap.headImg && fieldMap.headImg.trim()) {
      data[fieldMap.headImg] = article.headImageId;
      if (this.options.verbose) {
        console.log(chalk.green(`🖼️ Set head image: ${fieldMap.headImg} = ${article.headImageId}`));
      }
    }
    
    // Slug field - if auto-generation enabled and mapped
    if (advancedSettings.generateSlug && fieldMap.slug && fieldMap.slug.trim()) {
      const slugValue = article.slug || this.generateSlug(article.title);
      data[fieldMap.slug] = slugValue;
      if (this.options.verbose) {
        console.log(chalk.blue(`🔧 Using slug: ${slugValue}`));
      }
    }

    // Enhanced metadata fields
    if (article.siteName && fieldMap.siteName && fieldMap.siteName.trim()) {
      data[fieldMap.siteName] = article.siteName.substring(0, 100);
    }

    if (article.language && fieldMap.language && fieldMap.language.trim()) {
      data[fieldMap.language] = article.language.substring(0, 10);
    }

    if (article.tags && article.tags.length > 0 && fieldMap.tags && fieldMap.tags.trim()) {
      data[fieldMap.tags] = JSON.stringify(article.tags);
    }

    if (article.readingTime && fieldMap.readingTime && fieldMap.readingTime.trim()) {
      data[fieldMap.readingTime] = article.readingTime;
    }

    if (article.created && fieldMap.created && fieldMap.created.trim()) {
      data[fieldMap.created] = article.created;
    }

    // Apply field presets
    if (fieldPresets && fieldPresets.enabled && fieldPresets.presets) {
      if (this.options.verbose) {
        console.log(chalk.blue('🎯 Applying field presets:'), Object.keys(fieldPresets.presets));
      }
      
      Object.entries(fieldPresets.presets).forEach(([fieldName, config]) => {
        if (fieldName && config.value !== undefined && config.value !== '') {
          let processedValue = config.value;
          
          // Process value based on type
          switch (config.type) {
            case 'number':
              processedValue = Number(config.value);
              if (isNaN(processedValue)) {
                console.warn(chalk.yellow(`⚠️ Invalid number for field ${fieldName}: "${config.value}"`));
                processedValue = config.value;
              }
              break;
            case 'boolean':
              if (typeof config.value === 'string') {
                processedValue = config.value.toLowerCase() === 'true' || config.value === '1';
              } else {
                processedValue = Boolean(config.value);
              }
              break;
            case 'json':
              try {
                processedValue = JSON.parse(config.value);
              } catch (error) {
                console.warn(chalk.yellow(`⚠️ Invalid JSON for field ${fieldName}:`, error.message));
                processedValue = config.value;
              }
              break;
            default:
              processedValue = String(config.value);
          }
          
          data[fieldName] = processedValue;
          if (this.options.verbose) {
            console.log(chalk.green(`✅ Applied preset: ${fieldName} = ${JSON.stringify(processedValue)} (${config.type})`));
          }
        }
      });
    }

    if (this.options.verbose) {
      console.log(chalk.blue('📊 Final data summary:'));
      console.log('  Fields:', Object.keys(data));
      console.log('  Data size:', JSON.stringify(data).length, 'characters');
    }

    return data;
  }

  // Upload image to Strapi media library
  async uploadImageToStrapi(imageBuffer, filename, imageInfo = {}) {
    const { strapiUrl, token } = this.config;
    
    if (!strapiUrl || !token) {
      throw new Error('Strapi configuration incomplete');
    }
    
    try {
      // Use form-data package for Node.js compatibility
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      // Append buffer directly to form data
      formData.append('files', imageBuffer, {
        filename: filename,
        contentType: imageInfo.mimeType || 'image/jpeg'
      });
      
      // Add metadata if available
      if (imageInfo) {
        const fileInfo = {
          caption: imageInfo.caption || `Image from article: ${filename}`,
          alternativeText: imageInfo.alt || filename,
          name: filename
        };
        formData.append('fileInfo', JSON.stringify(fileInfo));
      }
      
      if (this.options.verbose) {
        console.log(chalk.blue(`📤 Uploading image: ${filename} (${Math.round(imageBuffer.length / 1024)}KB)`));
      }
      
      const response = await axios.post(`${strapiUrl}/api/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders() // Get proper headers from form-data
        },
        timeout: 60000 // 60 second timeout for uploads
      });
      
      if (this.options.verbose) {
        console.log(chalk.green(`✅ Image uploaded successfully: ${filename}`));
      }
      
      return response.data;
      
    } catch (error) {
      if (this.options.verbose) {
        console.error(chalk.red(`❌ Image upload failed (${filename}):`, error.message));
      }
      throw error;
    }
  }

  // Send article to Strapi
  async sendToStrapi(article) {
    const { strapiUrl, token, collection } = this.config;
    
    if (!strapiUrl || !token || !collection) {
      throw new Error('Strapi configuration incomplete. Please check strapiUrl, token, and collection.');
    }

    try {
      // Validate and format article data
      const articleData = this.validateArticleData(article);
      
      const endpoint = `${strapiUrl}/api/${collection}`;
      
      if (this.options.verbose) {
        console.log(chalk.blue('📤 Sending article to Strapi:'));
        console.log('  Endpoint:', endpoint);
        console.log('  Fields:', Object.keys(articleData));
      }
      
      const requestBody = { data: articleData };
      
      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000
      });
      
      if (this.options.verbose) {
        console.log(chalk.green('✅ Article created successfully:'));
        console.log('  Status:', response.status);
        console.log('  ID:', response.data?.data?.id);
      }
      
      return response.data;
      
    } catch (error) {
      // Enhanced error handling for common Strapi issues
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400 && data.error) {
          // Validation errors
          if (data.error.name === 'ValidationError') {
            throw new Error(`Validation error: ${data.error.message}. Check your field mapping and data types.`);
          }
          
          // Field mapping errors
          if (data.error.message && data.error.message.includes('Invalid key')) {
            throw new Error(`Field mapping error: ${data.error.message}. Check your field names in the configuration.`);
          }
        }
        
        if (status === 401) {
          throw new Error('Authentication failed. Check your API token and permissions.');
        }
        
        if (status === 403) {
          throw new Error('Permission denied. Ensure your API token has write access to the collection.');
        }
        
        if (status === 404) {
          throw new Error(`Collection '${collection}' not found. Check your collection name.`);
        }
        
        throw new Error(`Strapi API error (${status}): ${data.error?.message || 'Unknown error'}`);
      }
      
      throw error;
    }
  }
}

export default StrapiIntegration;