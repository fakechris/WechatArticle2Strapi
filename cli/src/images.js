import axios from 'axios';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import mimeTypes from 'mime-types';
import chalk from 'chalk';

class ImageProcessor {
  constructor(options = {}) {
    this.options = {
      maxImages: 10,
      imageQuality: 0.8,
      maxWidth: 1200,
      maxHeight: 800,
      downloadTimeout: 30000,
      outputDir: './images',
      ...options
    };
  }

  async process(article, baseUrl) {
    if (!article.images || article.images.length === 0) {
      return article;
    }

    if (this.options.verbose) {
      console.log(chalk.blue(`\n📷 Processing ${article.images.length} images...`));
    }

    const processedImages = [];
    const imagesToProcess = article.images.slice(0, this.options.maxImages);

    // Ensure output directory exists
    await fs.ensureDir(this.options.outputDir);

    for (let i = 0; i < imagesToProcess.length; i++) {
      const image = imagesToProcess[i];
      
      try {
        if (this.options.verbose) {
          console.log(chalk.gray(`Processing image ${i + 1}/${imagesToProcess.length}: ${image.src.substring(0, 60)}...`));
        }

        const processedImage = await this.processIndividualImage(image, i, baseUrl);
        if (processedImage) {
          processedImages.push(processedImage);
        }
      } catch (error) {
        if (this.options.verbose) {
          console.log(chalk.yellow(`⚠️ Failed to process image ${i + 1}: ${error.message}`));
        }
      }
    }

    if (this.options.verbose) {
      console.log(chalk.green(`✅ Successfully processed ${processedImages.length}/${imagesToProcess.length} images`));
    }

    return {
      ...article,
      processedImages: processedImages,
      imageProcessingStats: {
        total: imagesToProcess.length,
        successful: processedImages.length,
        failed: imagesToProcess.length - processedImages.length
      }
    };
  }

  async processIndividualImage(image, index, baseUrl) {
    // Validate and resolve image URL
    const imageUrl = this.resolveImageUrl(image.src, baseUrl);
    if (!this.isValidImageUrl(imageUrl)) {
      throw new Error(`Invalid image URL: ${imageUrl}`);
    }

    // Download image
    const imageBuffer = await this.downloadImage(imageUrl);
    
    // Get image info
    const imageInfo = await this.analyzeImage(imageBuffer, imageUrl);
    
    // Generate filename
    const filename = this.generateFilename(image, imageInfo, index);
    const filepath = path.join(this.options.outputDir, filename);

    // Process/compress image if needed
    let processedBuffer = imageBuffer;
    if (this.shouldCompressImage(imageInfo)) {
      processedBuffer = await this.compressImage(imageBuffer, imageInfo);
    }

    // Save to file
    await fs.writeFile(filepath, processedBuffer);

    // Get final image info
    const finalInfo = await this.analyzeImage(processedBuffer, imageUrl);

    return {
      original: {
        url: imageUrl,
        size: imageBuffer.length,
        ...imageInfo
      },
      processed: {
        path: filepath,
        filename: filename,
        size: processedBuffer.length,
        ...finalInfo
      },
      compressionRatio: this.calculateCompressionRatio(imageBuffer.length, processedBuffer.length),
      alt: image.alt || '',
      index: index
    };
  }

  async downloadImage(url) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: this.options.downloadTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*,*/*;q=0.8',
          'Referer': url
        },
        maxRedirects: 5
      });

      if (!response.data || response.data.byteLength === 0) {
        throw new Error('Empty image response');
      }

      // Verify it's actually an image
      const buffer = Buffer.from(response.data);
      try {
        await sharp(buffer).metadata();
      } catch (err) {
        throw new Error('Downloaded file is not a valid image');
      }

      return buffer;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Download timeout');
      }
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  async analyzeImage(buffer, url) {
    try {
      const metadata = await sharp(buffer).metadata();
      const urlParts = new URL(url);
      const pathParts = urlParts.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      const extension = path.extname(filename).toLowerCase().slice(1);

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        channels: metadata.channels,
        density: metadata.density,
        hasProfile: metadata.hasProfile,
        hasAlpha: metadata.hasAlpha,
        extension: extension || metadata.format,
        mimeType: mimeTypes.lookup(metadata.format) || `image/${metadata.format}`,
        filename: filename,
        isAnimated: metadata.pages && metadata.pages > 1
      };
    } catch (error) {
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  shouldCompressImage(imageInfo) {
    // Compress if image is large or not in optimal format
    const isLarge = imageInfo.width > this.options.maxWidth || 
                    imageInfo.height > this.options.maxHeight;
    const isUnoptimized = !['jpeg', 'jpg', 'webp'].includes(imageInfo.format);
    
    return isLarge || isUnoptimized;
  }

  async compressImage(buffer, imageInfo) {
    try {
      let pipeline = sharp(buffer);

      // Resize if too large
      if (imageInfo.width > this.options.maxWidth || imageInfo.height > this.options.maxHeight) {
        pipeline = pipeline.resize(this.options.maxWidth, this.options.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert to JPEG with quality setting (unless it's a PNG with transparency)
      if (imageInfo.hasAlpha && imageInfo.format === 'png') {
        // Keep as PNG for transparency
        pipeline = pipeline.png({
          quality: Math.round(this.options.imageQuality * 100),
          compressionLevel: 9
        });
      } else {
        // Convert to JPEG
        pipeline = pipeline.jpeg({
          quality: Math.round(this.options.imageQuality * 100),
          progressive: true,
          mozjpeg: true
        });
      }

      return await pipeline.toBuffer();
    } catch (error) {
      // If compression fails, return original buffer
      console.warn(`Image compression failed: ${error.message}`);
      return buffer;
    }
  }

  generateFilename(image, imageInfo, index) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 6);
    
    // Use original filename if available, otherwise generate one
    let baseName = imageInfo.filename 
      ? path.parse(imageInfo.filename).name 
      : `image-${index + 1}`;
    
    // Clean filename
    baseName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30);
    
    // Add unique suffix
    baseName += `-${timestamp}-${randomId}`;
    
    // Determine extension
    const extension = imageInfo.extension || 'jpg';
    
    return `${baseName}.${extension}`;
  }

  resolveImageUrl(url, baseUrl) {
    try {
      // Handle protocol-relative URLs (starting with //)
      if (url.startsWith('//')) {
        return 'https:' + url;
      }

      // If it's already an absolute URL, return as-is
      new URL(url);
      return url;
    } catch {
      // If it's a relative URL, resolve against base URL
      try {
        return new URL(url, baseUrl).href;
      } catch {
        throw new Error(`Cannot resolve image URL: ${url}`);
      }
    }
  }

  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const invalidPrefixes = [
      'data:', 'chrome-extension://', 'moz-extension://', 
      'chrome://', 'about:', 'javascript:', 'blob:'
    ];
    
    for (const prefix of invalidPrefixes) {
      if (url.startsWith(prefix)) return false;
    }
    
    // Allow protocol-relative URLs before they are normalized
    if (url.startsWith('//')) {
      return true;
    }
    
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  calculateCompressionRatio(originalSize, compressedSize) {
    if (originalSize === 0) return 0;
    return Math.round((1 - compressedSize / originalSize) * 100);
  }
}

export default ImageProcessor;