/**
 * 统一的Strapi集成模块
 * 合并CLI和Chrome Extension的Strapi集成逻辑
 */

import { generateSlug } from '../../utils/slug-utils.js';

export class StrapiIntegration {
  constructor(config, options = {}) {
    this.config = config;
    this.options = {
      verbose: false,
      debug: false,
      environment: 'browser', // 'browser' | 'node'
      ...options
    };

    // 验证配置
    this.validateConfig();
  }

  /**
   * 验证Strapi配置
   */
  validateConfig() {
    if (!this.config) {
      throw new Error('Strapi配置不能为空');
    }

    const required = ['strapiUrl', 'token', 'collection'];
    for (const field of required) {
      if (!this.config[field]) {
        throw new Error(`Strapi配置缺少必需字段: ${field}`);
      }
    }

    // 标准化URL
    if (this.config.strapiUrl && !this.config.strapiUrl.endsWith('/')) {
      this.config.strapiUrl += '/';
    }
  }

  /**
   * 内容清理和格式化
   * @param {string} content - 原始内容
   * @param {number} maxLength - 最大长度
   * @returns {string} 清理后的内容
   */
  sanitizeContent(content, maxLength = 50000) {
    if (!content) return '';
    
    // 清理HTML内容
    let sanitized = content
      // 移除数据属性
      .replace(/data-[^=]*="[^"]*"/g, '')
      // 移除样式属性
      .replace(/style="[^"]*"/g, '')
      // 移除类属性
      .replace(/class="[^"]*"/g, '')
      // 移除ID属性
      .replace(/id="[^"]*"/g, '')
      // 移除脚本标签
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      // 移除样式标签
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      // 移除扩展相关图片
      .replace(/<img[^>]*src="chrome-extension:\/\/[^"]*"[^>]*>/gi, '')
      .replace(/<img[^>]*src="moz-extension:\/\/[^"]*"[^>]*>/gi, '')
      .replace(/<img[^>]*src="extension:\/\/[^"]*"[^>]*>/gi, '')
      // 移除内联SVG图片
      .replace(/<img[^>]*src="data:image\/svg\+xml[^"]*"[^>]*>/gi, '')
      // 替换空格实体
      .replace(/&nbsp;/g, ' ')
      // 合并多个空格
      .replace(/\s+/g, ' ')
      .trim();
    
    // 长度限制
    if (sanitized.length > maxLength) {
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

  /**
   * 验证文章数据
   * @param {Object} article - 文章数据
   * @returns {Object} 验证后的数据
   */
  validateArticleData(article) {
    const errors = [];
    
    // 必需字段验证
    if (!article.title || article.title.trim().length === 0) {
      errors.push('文章标题不能为空');
    }
    
    if (!article.content || article.content.trim().length === 0) {
      errors.push('文章内容不能为空');
    }
    
    // 字段长度验证
    if (article.title && article.title.length > 255) {
      errors.push('标题过长（最大255字符）');
    }
    
    if (errors.length > 0) {
      throw new Error('数据验证失败: ' + errors.join(', '));
    }

    return this.buildStrapiData(article);
  }

  /**
   * 构建Strapi数据对象
   * @param {Object} article - 文章数据
   * @returns {Object} Strapi格式的数据
   */
  buildStrapiData(article) {
    const fieldMapping = this.config.fieldMapping || { enabled: false, fields: {} };
    const fieldPresets = this.config.fieldPresets || { enabled: false, presets: {} };
    const advancedSettings = this.config.advancedSettings || {};
    
    // 获取字段映射
    const fieldMap = fieldMapping.enabled ? fieldMapping.fields : this.getDefaultFieldMapping();
    
    this.log('构建Strapi数据', { fieldMapping: fieldMapping.enabled, fieldMap });
    
    // 构建基础数据
    const data = {};
    
    // 必需字段
    if (fieldMap.title) {
      data[fieldMap.title] = article.title.trim().substring(0, 255);
    }
    
    if (fieldMap.content) {
      const maxContentLength = advancedSettings.maxContentLength || 50000;
      if (advancedSettings.sanitizeContent !== false) {
        data[fieldMap.content] = this.sanitizeContent(article.content, maxContentLength);
      } else {
        data[fieldMap.content] = article.content.substring(0, maxContentLength);
      }
    }
    
    // 可选字段
    this.addOptionalField(data, fieldMap, 'author', article.author, 100);
    this.addOptionalField(data, fieldMap, 'publishTime', article.publishTime);
    this.addOptionalField(data, fieldMap, 'digest', article.digest, 500);
    this.addOptionalField(data, fieldMap, 'sourceUrl', article.url);
    
    // 图片字段 - 修改为支持所有图片ID数组
    if (article.allImageIds && article.allImageIds.length > 0 && fieldMap.images) {
      // Strapi v4 多选media字段格式：ID数组
      data[fieldMap.images] = article.allImageIds.map(id => Number(id));
      
      this.log('设置图片数组字段', { 
        field: fieldMap.images, 
        imageIds: article.allImageIds,
        finalValue: data[fieldMap.images]
      });
    }
    
    // 头图字段 - 修复Strapi media字段格式
    if (article.headImageId && fieldMap.headImg) {
      // Strapi v4 单选media字段格式：直接使用数字ID
      const headImgValue = Number(article.headImageId);
      data[fieldMap.headImg] = headImgValue;
      
      this.log('设置头图字段', { 
        field: fieldMap.headImg, 
        originalId: article.headImageId,
        finalValue: headImgValue,
        valueType: typeof headImgValue
      });
      
      // 额外调试：检查头图信息
      if (article.headImageInfo) {
        this.log('头图详细信息', {
          id: article.headImageInfo.id,
          url: article.headImageInfo.url,
          filename: article.headImageInfo.filename,
          originalUrl: article.headImageInfo.originalUrl
        });
      }
    } else if (fieldMap.headImg) {
      this.log('头图字段跳过', {
        field: fieldMap.headImg,
        hasHeadImageId: !!article.headImageId,
        headImageId: article.headImageId,
        reason: !article.headImageId ? '没有头图ID' : '字段映射不存在'
      });
    }
    
    // Slug字段
    if (advancedSettings.generateSlug && fieldMap.slug) {
      const slugValue = article.slug || generateSlug(article.title);
      data[fieldMap.slug] = slugValue;
      this.log('生成Slug', { slug: slugValue });
    }
    
    // 增强元数据字段
    this.addOptionalField(data, fieldMap, 'siteName', article.siteName, 100);
    this.addOptionalField(data, fieldMap, 'language', article.language, 10);
    this.addOptionalField(data, fieldMap, 'tags', article.tags);
    this.addOptionalField(data, fieldMap, 'readingTime', article.readingTime);
    this.addOptionalField(data, fieldMap, 'created', article.extractedAt || new Date().toISOString());
    
    // 预设字段
    if (fieldPresets.enabled && fieldPresets.presets) {
      for (const [field, preset] of Object.entries(fieldPresets.presets)) {
        if (preset.value !== undefined) {
          data[field] = preset.value;
          this.log('应用预设字段', { field, value: preset.value });
        }
      }
    }
    
    return data;
  }

  /**
   * 添加可选字段
   */
  addOptionalField(data, fieldMap, sourceField, value, maxLength = null) {
    if (value && fieldMap[sourceField]) {
      let processedValue = typeof value === 'string' ? value.trim() : value;
      if (maxLength && typeof processedValue === 'string') {
        processedValue = processedValue.substring(0, maxLength);
      }
      data[fieldMap[sourceField]] = processedValue;
    }
  }

  /**
   * 获取默认字段映射
   */
  getDefaultFieldMapping() {
    return {
      title: 'title',
      content: 'content',
      author: 'author',
      publishTime: 'publishTime',
      digest: 'digest',
      sourceUrl: 'sourceUrl',
      images: 'images',
      slug: 'slug',
      siteName: 'siteName',
      language: 'language',
      tags: 'tags',
      readingTime: 'readingTime',
      created: 'extractedAt',
      headImg: 'head_img'
    };
  }

  /**
   * 上传图片到Strapi
   * @param {Buffer|Blob} imageData - 图片数据
   * @param {string} filename - 文件名
   * @param {Object} imageInfo - 图片信息
   * @returns {Promise<Object>} 上传结果
   */
  async uploadImageToStrapi(imageData, filename, imageInfo = {}) {
    this.log('开始上传图片', { 
      filename, 
      environment: this.options.environment,
      dataType: imageData?.constructor?.name,
      dataSize: imageData?.length || imageData?.byteLength || imageData?.size
    });

    const formData = this.options.environment === 'browser' 
      ? this.createFormData() 
      : await this.createNodeFormData();
    
    this.log('FormData创建成功', { 
      formDataType: formData?.constructor?.name,
      hasGetHeaders: typeof formData?.getHeaders === 'function'
    });
    
    // 添加文件数据，确保正确的MIME类型
    if (this.options.environment === 'browser') {
      // 根据文件扩展名确定MIME类型
      const mimeType = this.getMimeType(filename);
      const blob = new Blob([imageData], { type: mimeType });
      formData.append('files', blob, filename);
      this.log('浏览器环境文件添加', { filename, mimeType, blobSize: blob.size });
    } else {
      // Node.js环境：确保imageData是Buffer类型
      const buffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData);
      this.log('准备添加文件到FormData', { 
        bufferSize: buffer.length,
        filename 
      });
      formData.append('files', buffer, filename);
    }
    
    // 添加文件信息（如果有）
    if (imageInfo.alt) {
      // Strapi upload API的正确格式：不使用fileInfo，而是在上传成功后更新元数据
      // 这里我们先简单上传，成功后可以通过API更新元数据
      this.log('跳过fileInfo（将在上传后设置元数据）', { 
        alt: imageInfo.alt,
        filename 
      });
    }
    
    const httpClient = this.getHttpClient();
    
    this.log('发送上传请求', {
      url: `${this.config.strapiUrl}api/upload`,
      hasAuth: !!this.config.token,
      formDataType: formData?.constructor?.name
    });

    try {
      const response = await httpClient.post(
        `${this.config.strapiUrl}api/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            // 不设置Content-Type，让浏览器/form-data自动设置
          }
        }
      );
      
      this.log('上传请求响应', {
        status: response.status,
        statusText: response.statusText,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: response.data?.length
      });
      
      if ((response.status === 200 || response.status === 201) && response.data && response.data.length > 0) {
        const uploadedFile = response.data[0];
        this.log('图片上传成功', { filename, id: uploadedFile.id });
        
        // 如果有alt文本，更新文件元数据
        if (imageInfo.alt && uploadedFile.id) {
          try {
            await this.updateFileMetadata(uploadedFile.id, {
              alternativeText: imageInfo.alt,
              caption: imageInfo.caption || null
            });
            this.log('文件元数据更新成功', { id: uploadedFile.id, alt: imageInfo.alt });
          } catch (metaError) {
            this.log('文件元数据更新失败（但上传成功）', { 
              id: uploadedFile.id, 
              error: metaError.message 
            });
            // 不抛出错误，因为主要的上传已经成功
          }
        }
        
        return uploadedFile;
      } else {
        throw new Error(`图片上传失败: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      // 详细的错误信息
      const errorDetails = {
        filename,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl: `${this.config.strapiUrl}api/upload`
      };
      
      this.log('🚨 图片上传详细错误', errorDetails);
      
      // 如果是400错误，提供更多诊断信息
      if (error.response?.status === 400) {
        this.log('💡 400错误可能原因', [
          '1. 文件格式不支持 - 检查Strapi允许的文件类型',
          '2. 文件大小超限 - 检查Strapi上传大小限制',
          '3. API Token权限不足 - 确保Token有Upload权限',
          '4. 字段格式错误 - 检查fileInfo格式',
          '5. Strapi配置问题 - 检查Upload插件设置'
        ]);
        
        if (error.response?.data) {
          this.log('🔍 Strapi错误响应详情', error.response.data);
        }
      }
      
      throw error;
    }
  }

  /**
   * 获取图片实际尺寸
   * @param {string} imageUrl - 图片URL
   * @returns {Promise<Object>} 图片尺寸信息
   */
  async getImageDimensions(imageUrl) {
    // 在浏览器环境中使用Image对象
    if (typeof window !== 'undefined') {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = function() {
          resolve({
            width: this.naturalWidth,
            height: this.naturalHeight,
            aspectRatio: this.naturalWidth / this.naturalHeight
          });
        };
        
        img.onerror = function() {
          reject(new Error(`无法加载图片: ${imageUrl}`));
        };
        
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
      });
    } else {
      // 在Node.js环境中使用image-size包获取图片尺寸
      try {
        // 检查是否为Node.js环境
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          // 动态导入所需模块（ES6方式）
          const [axiosModule, imageSizeModule] = await Promise.all([
            this.importAxios(),
            import('image-size')
          ]);
          
          const axios = axiosModule.default || axiosModule;
          const sizeOf = imageSizeModule.default || imageSizeModule;
          
          const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            },
            timeout: 10000
          });
          
          const dimensions = sizeOf(Buffer.from(response.data));
          
          return {
            width: dimensions.width,
            height: dimensions.height,
            aspectRatio: dimensions.width / dimensions.height
          };
        } else {
          throw new Error('Not in Node.js environment');
        }
      } catch (error) {
        this.log(`无法获取图片尺寸: ${error.message}`);
        // 如果获取失败，返回默认值
        return {
          width: 0,
          height: 0,
          aspectRatio: 1
        };
      }
    }
  }

  /**
   * 检查图片是否符合头图尺寸要求
   * @param {string} imageUrl - 图片URL
   * @param {number} minWidth - 最小宽度，默认200
   * @param {number} minHeight - 最小高度，默认200
   * @returns {Promise<Object>} 验证结果
   */
  async isValidHeadImage(imageUrl, minWidth = 200, minHeight = 200) {
    try {
      const dimensions = await this.getImageDimensions(imageUrl);
      const isValid = dimensions.width >= minWidth && dimensions.height >= minHeight;
      
      this.log(`图片尺寸检查: ${imageUrl.substring(0, 60)}...`, {
        width: dimensions.width,
        height: dimensions.height,
        minWidth,
        minHeight,
        isValid
      });
      
      return {
        isValid,
        dimensions
      };
    } catch (error) {
      this.log(`图片尺寸检查失败: ${error.message}`);
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * 查找符合尺寸要求的头图
   * @param {Array} images - 图片数组
   * @param {number} minWidth - 最小宽度，默认200
   * @param {number} minHeight - 最小高度，默认200
   * @returns {Promise<Object>} 查找结果
   */
  async findValidHeadImage(images, minWidth = 200, minHeight = 200) {
    this.log(`查找符合尺寸要求的头图 (最小: ${minWidth}x${minHeight})`);
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      this.log(`检查第 ${i + 1} 张图片...`);
      
      const validationResult = await this.isValidHeadImage(image.src, minWidth, minHeight);
      
      if (validationResult.isValid) {
        this.log(`找到符合要求的头图: 索引 ${i}, 尺寸 ${validationResult.dimensions.width}x${validationResult.dimensions.height}`);
        return {
          image,
          index: i,
          dimensions: validationResult.dimensions
        };
      } else {
        this.log(`第 ${i + 1} 张图片不符合尺寸要求`);
      }
    }
    
    this.log('未找到符合尺寸要求的头图');
    return null;
  }

  /**
   * 处理头图上传
   * @param {Object} article - 文章数据
   * @param {Object} advancedSettings - 高级设置
   * @returns {Promise<Object>} 处理后的文章数据
   */
  async processHeadImage(article, advancedSettings) {
    if (!article.images || article.images.length === 0) {
      this.log('没有发现图片，跳过头图处理');
      return article;
    }

    // 🔥 新增：根据尺寸要求查找合适的头图
    const minWidth = 200;  // 最小宽度
    const minHeight = 200; // 最小高度
    
    this.log(`查找符合尺寸要求的头图 (最小: ${minWidth}x${minHeight})`);
    
    let targetImage;
    let targetIndex;
    let imageDimensions;
    
    // 如果指定了头图索引，先检查该索引的图片
    if (advancedSettings.headImgIndex !== undefined && advancedSettings.headImgIndex >= 0) {
      const specifiedIndex = advancedSettings.headImgIndex;
      const specifiedImage = article.images[specifiedIndex];
      
      if (specifiedImage) {
        this.log(`检查指定的头图索引 ${specifiedIndex}...`);
        const validationResult = await this.isValidHeadImage(specifiedImage.src, minWidth, minHeight);
        
        if (validationResult.isValid) {
          targetImage = specifiedImage;
          targetIndex = specifiedIndex;
          imageDimensions = validationResult.dimensions;
          this.log(`指定索引的图片符合要求: ${imageDimensions.width}x${imageDimensions.height}`);
        } else {
          this.log(`指定索引的图片不符合尺寸要求，将搜索其他图片...`);
        }
      }
    }
    
    // 如果指定索引的图片不符合要求，或者没有指定索引，则搜索所有图片
    if (!targetImage) {
      const validHeadImageResult = await this.findValidHeadImage(article.images, minWidth, minHeight);
      
      if (validHeadImageResult) {
        targetImage = validHeadImageResult.image;
        targetIndex = validHeadImageResult.index;
        imageDimensions = validHeadImageResult.dimensions;
      } else {
        this.log('没有找到符合尺寸要求的头图，跳过头图处理');
        return {
          ...article,
          headImageError: `未找到符合尺寸要求的头图 (最小: ${minWidth}x${minHeight})`
        };
      }
    }

    this.log(`选择第 ${targetIndex + 1} 张图片作为头图，尺寸: ${imageDimensions.width}x${imageDimensions.height}`);

    try {
      // 下载图片数据
      const imageData = await this.downloadImage(targetImage.src);
      const filename = this.generateHeadImageFilename(article.title, targetImage.src);

      // 上传到Strapi
      const uploadResult = await this.uploadImageToStrapi(
        imageData, 
        filename, 
        {
          alt: targetImage.alt || `Head image for ${article.title}`,
          isHeadImage: true
        }
      );

      this.log('头图上传成功', { 
        filename, 
        id: uploadResult.id,
        dimensions: `${imageDimensions.width}x${imageDimensions.height}`
      });

      // 获取完整的图片URL
      const fullImageUrl = this.getFullImageUrl(uploadResult);

      // 初始化 allImageIds 数组，确保头图ID包含在其中
      const allImageIds = article.allImageIds || [];
      if (!allImageIds.includes(uploadResult.id)) {
        allImageIds.unshift(uploadResult.id); // 将头图ID放在数组第一位
      }

      return {
        ...article,
        headImageId: uploadResult.id,
        headImageUrl: fullImageUrl,
        allImageIds: allImageIds,
        headImageInfo: {
          id: uploadResult.id,
          url: fullImageUrl,
          filename: uploadResult.name,
          originalUrl: targetImage.src,
          originalDimensions: imageDimensions,
          selectedIndex: targetIndex,
          uploadedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      this.log('头图处理失败', { error: error.message });
      return {
        ...article,
        headImageError: error.message
      };
    }
  }

  /**
   * 处理文章图片上传
   * @param {Object} article - 文章数据
   * @param {Object} advancedSettings - 高级设置
   * @returns {Promise<Object>} 处理后的文章数据
   */
  async processArticleImages(article, advancedSettings) {
    if (!article.images || article.images.length === 0) {
      this.log('没有发现图片，跳过图片处理');
      return article;
    }

    const maxImages = advancedSettings.maxImages || 10;
    const imagesToProcess = article.images.slice(0, maxImages);
    
    this.log(`开始处理 ${imagesToProcess.length} 张图片`);
    
    const processedImages = [];
    let updatedContent = article.content;
    
    // 初始化 allImageIds 数组，保留已有的头图ID
    const allImageIds = article.allImageIds || [];
    
    // 并发处理图片（3张一批）
    const batchSize = 3;
    for (let i = 0; i < imagesToProcess.length; i += batchSize) {
      const batch = imagesToProcess.slice(i, i + batchSize);
      const batchPromises = batch.map((image, index) => 
        this.processIndividualImage(image, i + index)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const originalImage = batch[j];
        
        if (result.status === 'fulfilled' && result.value) {
          const processedImage = result.value;
          processedImages.push(processedImage);
          
          // 将图片ID添加到 allImageIds 数组中（避免重复）
          if (!allImageIds.includes(processedImage.id)) {
            allImageIds.push(processedImage.id);
          }
          
          // 替换内容中的图片链接
          updatedContent = this.smartReplaceImageInContent(
            updatedContent, 
            originalImage.src, 
            processedImage.url
          );
          
          this.log(`图片处理成功`, { 
            filename: processedImage.name,
            id: processedImage.id 
          });
        } else {
          this.log(`图片处理失败`, { 
            src: originalImage.src.substring(0, 60) + '...', 
            error: result.reason?.message 
          });
        }
      }
      
      // 批次间延迟
      if (i + batchSize < imagesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    this.log(`图片处理完成，成功: ${processedImages.length}/${imagesToProcess.length}`);
    this.log(`所有图片ID数组`, { allImageIds });

    return {
      ...article,
      content: updatedContent,
      processedImages: processedImages,
      allImageIds: allImageIds
    };
  }

  /**
   * 处理单个图片
   * @param {Object} image - 图片对象
   * @param {number} index - 图片索引
   * @returns {Promise<Object>} 处理结果
   */
  async processIndividualImage(image, index) {
    try {
      // 下载图片
      const imageData = await this.downloadImage(image.src);
      const filename = this.generateImageFilename(image.src, index);
      
      // 上传到Strapi
      const uploadResult = await this.uploadImageToStrapi(
        imageData,
        filename,
        {
          alt: image.alt || `Article image ${index + 1}`,
          caption: `Image from article`
        }
      );
      
      // 获取完整的图片URL
      const fullImageUrl = this.getFullImageUrl(uploadResult);
      
      return {
        id: uploadResult.id,
        url: fullImageUrl,
        name: uploadResult.name,
        originalUrl: image.src
      };
      
    } catch (error) {
      this.log('单个图片处理失败', { src: image.src, error: error.message });
      throw error;
    }
  }

  /**
   * 下载图片数据
   * @param {string} imageUrl - 图片URL
   * @returns {Promise<Buffer|Blob>} 图片数据
   */
  async downloadImage(imageUrl) {
    if (this.options.environment === 'browser') {
      // 浏览器环境：使用fetch下载
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`图片下载失败: ${response.status}`);
      }
      return await response.blob();
    } else {
      // Node.js环境：需要实现HTTP下载
      const axios = await this.importAxios();
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    }
  }

  /**
   * 生成头图文件名
   * @param {string} articleTitle - 文章标题
   * @param {string} imageUrl - 图片URL
   * @returns {string} 文件名
   */
  generateHeadImageFilename(articleTitle, imageUrl) {
    const extension = this.getImageExtension(imageUrl);
    const slug = generateSlug(articleTitle).substring(0, 30);
    const timestamp = Date.now();
    return `head-${slug}-${timestamp}.${extension}`;
  }

  /**
   * 生成图片文件名
   * @param {string} imageUrl - 图片URL
   * @param {number} index - 图片索引
   * @returns {string} 文件名
   */
  generateImageFilename(imageUrl, index) {
    const extension = this.getImageExtension(imageUrl);
    const timestamp = Date.now();
    return `image-${index + 1}-${timestamp}.${extension}`;
  }

  /**
   * 获取图片扩展名
   * @param {string} imageUrl - 图片URL
   * @returns {string} 扩展名
   */
  getImageExtension(imageUrl) {
    const urlPath = imageUrl.split('?')[0]; // 移除查询参数
    
    // 从URL路径获取扩展名
    let extension = urlPath.split('.').pop().toLowerCase();
    
    // 检查查询参数中的wx_fmt（微信图片格式）
    const urlParams = new URL(imageUrl).searchParams;
    const wxFormat = urlParams.get('wx_fmt');
    if (wxFormat) {
      extension = wxFormat.toLowerCase();
    }
    
    // 验证是否为有效的图片扩展名
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    
    // 格式转换
    if (extension === 'jpeg') extension = 'jpg';
    
    this.log('图片扩展名解析', { 
      url: imageUrl.substring(0, 60) + '...', 
      extracted: extension,
      wxFormat,
      final: validExtensions.includes(extension) ? extension : 'jpg'
    });
    
    return validExtensions.includes(extension) ? extension : 'jpg';
  }

  /**
   * 根据文件名获取MIME类型
   * @param {string} filename - 文件名
   * @returns {string} MIME类型
   */
  getMimeType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml'
    };
    
    const mimeType = mimeTypes[extension] || 'image/jpeg';
    this.log('MIME类型确定', { filename, extension, mimeType });
    return mimeType;
  }

  /**
   * 智能替换内容中的图片链接
   * @param {string} content - 文章内容
   * @param {string} originalUrl - 原始图片URL
   * @param {string} newUrl - 新的图片URL
   * @returns {string} 更新后的内容
   */
  smartReplaceImageInContent(content, originalUrl, newUrl) {
    if (!content || !originalUrl || !newUrl) {
      this.log('⚠️ 图片链接替换参数不完整');
      return content;
    }
    
    this.log(`🔄 开始替换图片链接`, { 
      originalUrl: originalUrl.substring(0, 60) + '...', 
      newUrl: newUrl.substring(0, 60) + '...'
    });
    
    let updatedContent = content;
    let replacementCount = 0;
    
    // 处理HTML编码的URL
    const originalEscaped = this.escapeRegExp(originalUrl);
    const htmlEncodedUrl = originalUrl.replace(/&/g, '&amp;');
    const htmlEncodedEscaped = this.escapeRegExp(htmlEncodedUrl);
    
    // 1. 智能替换img标签中的data-src属性，同时添加src属性
    const imgDataSrcRegex = new RegExp(`(<img[^>]*?)data-src="([^"]*${originalEscaped}[^"]*)"([^>]*?>)`, 'gi');
    const imgMatches = updatedContent.match(imgDataSrcRegex);
    if (imgMatches) {
      updatedContent = updatedContent.replace(imgDataSrcRegex, (match, before, url, after) => {
        replacementCount++;
        // 检查是否已经有src属性
        if (before.includes('src=') || after.includes('src=')) {
          // 如果已有src属性，只替换data-src
          return `${before}data-src="${newUrl}"${after}`;
        } else {
          // 如果没有src属性，同时添加src和data-src
          return `${before}src="${newUrl}" data-src="${newUrl}"${after}`;
        }
      });
    }
    
    // 2. 处理HTML编码版本的data-src
    if (htmlEncodedUrl !== originalUrl) {
      const imgDataSrcHtmlRegex = new RegExp(`(<img[^>]*?)data-src="([^"]*${htmlEncodedEscaped}[^"]*)"([^>]*?>)`, 'gi');
      const imgHtmlMatches = updatedContent.match(imgDataSrcHtmlRegex);
      if (imgHtmlMatches) {
        updatedContent = updatedContent.replace(imgDataSrcHtmlRegex, (match, before, url, after) => {
          replacementCount++;
          // 检查是否已经有src属性
          if (before.includes('src=') || after.includes('src=')) {
            // 如果已有src属性，只替换data-src
            return `${before}data-src="${newUrl}"${after}`;
          } else {
            // 如果没有src属性，同时添加src和data-src
            return `${before}src="${newUrl}" data-src="${newUrl}"${after}`;
          }
        });
      }
    }
    
    // 3. 替换现有的src属性
    const srcRegex = new RegExp(`src="([^"]*${originalEscaped}[^"]*)"`, 'gi');
    const srcMatches = updatedContent.match(srcRegex);
    if (srcMatches) {
      updatedContent = updatedContent.replace(srcRegex, `src="${newUrl}"`);
      replacementCount += srcMatches.length;
    }
    
    // 4. 处理HTML编码的src属性
    if (htmlEncodedUrl !== originalUrl) {
      const htmlSrcRegex = new RegExp(`src="([^"]*${htmlEncodedEscaped}[^"]*)"`, 'gi');
      const htmlSrcMatches = updatedContent.match(htmlSrcRegex);
      if (htmlSrcMatches) {
        updatedContent = updatedContent.replace(htmlSrcRegex, `src="${newUrl}"`);
        replacementCount += htmlSrcMatches.length;
      }
    }
    
    // 5. 直接替换URL（作为后备方案）
    const directRegex = new RegExp(originalEscaped, 'g');
    const directMatches = updatedContent.match(directRegex);
    if (directMatches) {
      updatedContent = updatedContent.replace(directRegex, newUrl);
      replacementCount += directMatches.length;
    }
    
    this.log(`✅ 图片链接替换完成，共替换 ${replacementCount} 处`);
    
    if (replacementCount === 0) {
      this.log(`⚠️ 未找到要替换的图片链接`, { 
        originalUrl: originalUrl,
        htmlEncodedUrl: htmlEncodedUrl,
        contentPreview: content.substring(0, 200) + '...'
      });
    }
    
    return updatedContent;
  }

  /**
   * 辅助函数：转义正则表达式特殊字符
   * @param {string} string - 要转义的字符串
   * @returns {string} 转义后的字符串
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 获取完整的图片URL
   * @param {Object} uploadResult - Strapi上传结果
   * @returns {string} 完整的图片URL
   */
  getFullImageUrl(uploadResult) {
    if (!uploadResult || !uploadResult.url) {
      this.log('⚠️ 上传结果中没有URL');
      return null;
    }

    let imageUrl = uploadResult.url;
    
    // 如果是相对路径，转换为绝对路径
    if (imageUrl.startsWith('/')) {
      // 移除Strapi URL末尾的斜杠，避免双斜杠
      const baseUrl = this.config.strapiUrl.replace(/\/$/, '');
      imageUrl = baseUrl + imageUrl;
    }
    
    // 如果不是完整URL，添加Strapi URL前缀
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      const baseUrl = this.config.strapiUrl.replace(/\/$/, '');
      imageUrl = `${baseUrl}/${imageUrl}`;
    }
    
    this.log('图片URL处理', { 
      original: uploadResult.url,
      processed: imageUrl,
      baseUrl: this.config.strapiUrl
    });
    
    return imageUrl;
  }

  /**
   * 替换内容中的图片链接（废弃方法，使用smartReplaceImageInContent）
   * @deprecated
   */
  replaceImageInContent(content, originalUrl, newUrl) {
    this.log('⚠️ 使用已废弃的replaceImageInContent方法，建议使用smartReplaceImageInContent');
    return this.smartReplaceImageInContent(content, originalUrl, newUrl);
  }

  /**
   * 更新文件元数据
   * @param {number} fileId - 文件ID
   * @param {Object} metadata - 元数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateFileMetadata(fileId, metadata) {
    const httpClient = this.getHttpClient();
    
    try {
      const response = await httpClient.put(
        `${this.config.strapiUrl}api/upload/files/${fileId}`,
        metadata,
        {
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      this.log('更新文件元数据失败', { fileId, error: error.message });
      throw error;
    }
  }

  /**
   * 导入axios (Node.js环境)
   */
  async importAxios() {
    const { default: axios } = await import('axios');
    return axios;
  }

  /**
   * 发送文章到Strapi
   * @param {Object} article - 文章数据
   * @returns {Promise<Object>} 发送结果
   */
  async sendToStrapi(article) {
    try {
      this.log('开始发送文章到Strapi', { 
        title: article.title,
        hasImages: !!article.images,
        imageCount: article.images ? article.images.length : 0
      });

      // 🔥 新增：诊断图片上传配置
      const diagnosis = this.diagnoseImageUploadConfig();
      if (!diagnosis.configOK) {
        this.log('⚠️ 图片上传配置问题', diagnosis);
        
        // 如果有图片但配置有问题，打印警告
        if (article.images && article.images.length > 0) {
          console.warn('🚨 发现图片但配置有问题，图片将不会上传：');
          diagnosis.issues.forEach(issue => console.warn(`  - ${issue}`));
          console.warn('💡 解决建议：');
          diagnosis.recommendations.forEach(rec => console.warn(`  - ${rec}`));
        }
      }

      // 🔥 新增：处理图片上传（如果启用）
      let processedArticle = article;
      const advancedSettings = this.config.advancedSettings || {};
      
      // 处理所有图片上传（包括头图和内容图片）
      if ((advancedSettings.uploadHeadImg || advancedSettings.uploadImages) && article.images && article.images.length > 0) {
        
        // 先处理头图（如果启用）
        if (advancedSettings.uploadHeadImg) {
          this.log('开始处理头图上传', {
            uploadHeadImg: advancedSettings.uploadHeadImg,
            imageCount: article.images.length,
            headImgIndex: advancedSettings.headImgIndex || 0
          });
          processedArticle = await this.processHeadImage(processedArticle, advancedSettings);
          this.log('头图处理完成', {
            hasHeadImageId: !!processedArticle.headImageId,
            headImageId: processedArticle.headImageId,
            headImageUrl: processedArticle.headImageUrl
          });
        }
        
        // 再处理文章图片（如果启用）
        if (advancedSettings.uploadImages) {
          this.log('开始处理文章图片上传');
          processedArticle = await this.processArticleImages(processedArticle, advancedSettings);
        }
        
      } else if (article.images && article.images.length > 0) {
        // 有图片但未启用上传功能
        this.log('⚠️ 发现图片但未启用图片上传功能，图片将被跳过', {
          imageCount: article.images.length,
          uploadHeadImg: advancedSettings.uploadHeadImg,
          uploadImages: advancedSettings.uploadImages
        });
      } else {
        this.log('跳过图片处理', {
          hasImages: !!(article.images && article.images.length > 0),
          imageCount: article.images ? article.images.length : 0,
          reason: '没有图片或未启用图片上传'
        });
      }

      // 验证和构建数据
      const data = this.validateArticleData(processedArticle);
      
      this.log('发送到Strapi', { 
        collection: this.config.collection,
        title: data.title || data[Object.keys(data)[0]]
      });
      
      // 🔥 新增：发送前的配置调试
      this.logDebugInfo();
      
      const httpClient = this.getHttpClient();
      const endpoint = `${this.config.strapiUrl}api/${this.config.collection}`;
      
      this.log('请求详情', {
        url: endpoint,
        method: 'POST',
        tokenPrefix: this.config.token.substring(0, 20) + '...',
        tokenLength: this.config.token.length,
        dataKeys: Object.keys(data)
      });
      
      // 发送请求
      const response = await httpClient.post(
        endpoint,
        { data },
        {
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      this.log('响应状态', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers ? Object.fromEntries(Object.entries(response.headers)) : 'N/A'
      });
      
      if (response.status === 200 || response.status === 201) {
        this.log('文章发送成功', { id: response.data?.data?.id });
        return {
          success: true,
          data: response.data,
          id: response.data?.data?.id
        };
      } else {
        throw new Error(`发送失败: HTTP ${response.status}`);
      }
      
    } catch (error) {
      // 🔥 新增：详细的401错误调试
      if (error.response?.status === 401 || error.message.includes('401')) {
        this.logDetailedAuthError(error);
      }
      
      // 🔥 新增：详细的400错误调试  
      if (error.response?.status === 400 || error.message.includes('400')) {
        this.log('🚨 400错误详细调试', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          responseData: error.response?.data,
          sentData: Object.keys(data)
        });
        
        // 显示可能的原因
        this.log('💡 400错误可能原因', [
          '1. 字段验证失败 - 检查必需字段',
          '2. 字段类型不匹配 - 检查数据类型',
          '3. 字段长度超限 - 检查字符串长度',
          '4. 未知字段 - 检查Strapi模型定义',
          '5. 关联字段错误 - 检查关系字段格式'
        ]);
      }
      
      this.log('发送到Strapi失败', { error: error.message });
      return {
        success: false,
        error: error.message,
        details: error.response?.data || error
      };
    }
  }

  /**
   * 🔥 新增：调试配置信息
   */
  logDebugInfo() {
    this.log('🔍 Strapi配置调试信息', {
      strapiUrl: this.config.strapiUrl,
      collection: this.config.collection,
      tokenExists: !!this.config.token,
      tokenLength: this.config.token ? this.config.token.length : 0,
      tokenPrefix: this.config.token ? this.config.token.substring(0, 20) + '...' : '无'
    });

    // 检查Token格式
    if (this.config.token) {
      const isJWT = this.config.token.includes('.');
      this.log('Token格式检查', { isJWT });
      
      if (isJWT) {
        try {
          const parts = this.config.token.split('.');
          this.log('JWT结构', { partsCount: parts.length });
          
          if (parts.length >= 2) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            this.log('JWT载荷', payload);
            
            if (payload.exp) {
              const expDate = new Date(payload.exp * 1000);
              const now = new Date();
              const isExpired = now > expDate;
              
              this.log('JWT过期检查', {
                expiresAt: expDate.toISOString(),
                currentTime: now.toISOString(),
                isExpired
              });
              
              if (isExpired) {
                this.log('⚠️ JWT Token已过期！');
              }
            }
          }
        } catch (jwtError) {
          this.log('JWT解析错误', { error: jwtError.message });
        }
      }
    }
  }

  /**
   * 🔥 新增：详细的401错误调试
   */
  logDetailedAuthError(error) {
    this.log('🚨 401认证错误详细调试', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });

    this.log('🔍 可能的401错误原因', {
      reasons: [
        '1. Token无效或格式错误',
        '2. Token已过期',
        '3. Token权限不足',
        '4. Strapi URL配置错误',
        '5. Collection名称错误',
        '6. Strapi API版本不兼容'
      ]
    });

    // 尝试解析错误响应
    if (error.response?.data) {
      this.log('错误响应内容', error.response.data);
    }

    // 提供解决建议
    this.log('💡 解决建议', {
      suggestions: [
        '1. 检查Strapi管理面板中的API Token是否有效',
        '2. 确认Token具有足够的权限（Read & Write）',
        '3. 验证Strapi URL是否正确（包含http://或https://）',
        '4. 检查Collection名称是否与Strapi中的一致',
        '5. 尝试重新生成API Token'
      ]
    });
  }

  /**
   * 获取环境适配的HTTP客户端
   */
  getHttpClient() {
    if (this.options.environment === 'browser') {
      return new BrowserHttpClient();
    } else {
      return new NodeHttpClient();
    }
  }

  /**
   * 创建FormData对象
   */
  createFormData() {
    if (this.options.environment === 'browser' && typeof FormData !== 'undefined') {
      return new FormData();
    } else {
      // Node.js环境：动态导入form-data包
      return this.createNodeFormData();
    }
  }

  /**
   * 创建Node.js环境的FormData
   */
  async createNodeFormData() {
    try {
      const FormData = (await import('form-data')).default;
      return new FormData();
    } catch (error) {
      this.log('警告: form-data包未安装，使用简化实现', { error: error.message });
      // 简化的FormData实现作为后备
      return {
        append: (key, value, filename) => {
          this.log(`FormData.append: ${key} = ${filename || 'value'}`);
        }
      };
    }
  }

  /**
   * 调试日志
   */
  log(message, data = null) {
    if (this.options.verbose || this.options.debug) {
      console.log(`[StrapiIntegration] ${message}`, data || '');
    }
  }

  /**
   * 🔥 新增：诊断图片上传配置
   * @returns {Object} 诊断结果
   */
  diagnoseImageUploadConfig() {
    const diagnosis = {
      configOK: true,
      issues: [],
      recommendations: [],
      debug: {}
    };

    // 检查图片上传配置
    const advancedSettings = this.config.advancedSettings || {};
    diagnosis.debug.uploadImages = advancedSettings.uploadImages;
    
    if (!advancedSettings.uploadImages) {
      diagnosis.configOK = false;
      diagnosis.issues.push('图片上传功能未启用');
      diagnosis.recommendations.push('使用 --upload-images 参数启用图片上传，或在配置文件中设置 advancedSettings.uploadImages = true');
    }

    // 检查字段映射
    const fieldMapping = this.config.fieldMapping || { enabled: false, fields: {} };
    const fieldMap = fieldMapping.enabled ? fieldMapping.fields : this.getDefaultFieldMapping();
    
    diagnosis.debug.fieldMappingEnabled = fieldMapping.enabled;
    diagnosis.debug.imagesField = fieldMap.images;
    diagnosis.debug.headImgField = fieldMap.headImg;
    
    // 注意：图片上传不要求必须有images字段映射
    // 可以只上传图片并替换内容中的链接，而不在collection中存储图片列表

    // 检查头图配置
    if (advancedSettings.uploadHeadImg) {
      if (fieldMapping.enabled && !fieldMapping.fields.headImg) {
        diagnosis.configOK = false;
        diagnosis.issues.push('头图上传已启用但自定义字段映射中头图字段未配置');
        diagnosis.recommendations.push('在配置文件的 fieldMapping.fields.headImg 中指定头图字段名');
      }
    }

    // 检查Strapi连接
    if (!this.config.strapiUrl || !this.config.token) {
      diagnosis.configOK = false;
      diagnosis.issues.push('Strapi连接配置不完整');
      diagnosis.recommendations.push('确保配置了正确的Strapi URL和API Token');
    }

    this.log('图片上传配置诊断', diagnosis);
    return diagnosis;
  }
}

/**
 * 浏览器环境HTTP客户端
 */
class BrowserHttpClient {
  async post(url, data, config = {}) {
    const isFormData = data instanceof FormData;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: isFormData ? config.headers : {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: isFormData ? data : JSON.stringify(data)
    });
    
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData
    };
  }

  async get(url, config = {}) {
    const response = await fetch(url, {
      method: 'GET',
      headers: config.headers || {}
    });
    
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData
    };
  }

  async put(url, data, config = {}) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(data)
    });
    
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData
    };
  }
}

/**
 * Node.js环境HTTP客户端
 */
class NodeHttpClient {
  async post(url, data, config = {}) {
    // 动态导入axios（避免浏览器环境错误）
    const axios = await this.importAxios();
    
    // 处理form-data类型的数据
    if (data && typeof data.getHeaders === 'function') {
      // form-data对象，需要设置正确的headers
      const headers = {
        ...config.headers,
        ...data.getHeaders()
      };
      return axios.post(url, data, { ...config, headers });
    }
    
    return axios.post(url, data, config);
  }

  async get(url, config = {}) {
    const axios = await this.importAxios();
    return axios.get(url, config);
  }

  async put(url, data, config = {}) {
    const axios = await this.importAxios();
    return axios.put(url, data, config);
  }

  async importAxios() {
    const { default: axios } = await import('axios');
    return axios;
  }

} 