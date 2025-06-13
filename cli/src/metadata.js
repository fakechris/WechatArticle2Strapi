class MetadataExtractor {
  constructor() {
    this.authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]', 
      'meta[property="og:article:author"]',
      'meta[name="twitter:creator"]',
      '[rel="author"]',
      '.byline',
      '.author',
      '.writer',
      '.post-author',
      '.article-author',
      '[class*="author"]',
      '[data-author]'
    ];

    this.publishedSources = [
      'meta[property="article:published_time"]',
      'meta[property="og:article:published_time"]',
      'meta[name="publish_date"]',
      'meta[name="date"]',
      'meta[name="DC.date"]',
      'time[datetime]',
      'time[pubdate]',
      '[datetime]'
    ];

    this.tagSelectors = [
      '.tags a',
      '.tag',
      '.post-tags a', 
      '.article-tags a',
      '[rel="tag"]',
      '.hashtag'
    ];
  }

  extract(document, window, url) {
    const metadata = {
      title: '',
      source: url,
      author: '',
      published: '',
      created: new Date().toISOString(),
      description: '',
      siteName: '',
      canonical: '',
      language: '',
      tags: [],
      readingTime: 0
    };

    // Title extraction (multiple sources)
    metadata.title = this.extractTitle(document);

    // Author extraction
    metadata.author = this.extractAuthor(document, url);

    // Published date extraction
    metadata.published = this.extractPublishedDate(document, url);

    // Description extraction
    metadata.description = this.extractDescription(document, url);

    // Site name
    metadata.siteName = this.extractSiteName(document, window);

    // Canonical URL
    metadata.canonical = this.extractCanonicalUrl(document, url);

    // Language
    metadata.language = this.extractLanguage(document);

    // Keywords/Tags extraction
    metadata.tags = this.extractTags(document);

    // Reading time estimation
    metadata.readingTime = this.estimateReadingTime(document);

    // Clean and validate metadata
    this.cleanMetadata(metadata);

    return metadata;
  }

  extractTitle(document) {
    return document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
           document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
           document.querySelector('title')?.textContent ||
           document.querySelector('h1')?.textContent ||
           '';
  }

  extractAuthor(document, url) {
    // Check standard meta tags and elements first
    for (const selector of this.authorSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        let author;
        if (element.tagName === 'META') {
          author = element.getAttribute('content');
        } else {
          author = element.textContent?.trim();
        }
        if (author) return author;
      }
    }

    // WeChat specific author extraction
    if (new URL(url).hostname === 'mp.weixin.qq.com') {
      const wechatAuthor = document.querySelector('#js_name, .rich_media_meta_text, .account_nickname_inner');
      if (wechatAuthor) {
        return wechatAuthor.textContent?.trim() || '';
      }
    }

    return '';
  }

  extractPublishedDate(document, url) {
    // Check standard date sources
    for (const selector of this.publishedSources) {
      const element = document.querySelector(selector);
      if (element) {
        let dateValue = element.getAttribute('content') || 
                        element.getAttribute('datetime') || 
                        element.textContent;
        
        if (dateValue) {
          try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
          } catch (e) {
            // Continue to next source
          }
        }
      }
    }

    // WeChat specific publish date
    if (new URL(url).hostname === 'mp.weixin.qq.com') {
      const wechatTime = document.querySelector('#publish_time, .rich_media_meta_text');
      if (wechatTime) {
        const timeText = wechatTime.textContent?.trim();
        if (timeText) {
          try {
            const date = new Date(timeText);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            } else {
              return timeText; // Keep as text if parsing fails
            }
          } catch (e) {
            return timeText;
          }
        }
      }
    }

    return '';
  }

  extractDescription(document, url) {
    let description = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                      document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
                      '';

    // WeChat specific description
    if (new URL(url).hostname === 'mp.weixin.qq.com' && !description) {
      const wechatDesc = document.querySelector('.rich_media_meta_text');
      if (wechatDesc) {
        description = wechatDesc.textContent?.trim() || '';
      }
    }

    return description;
  }

  extractSiteName(document, window) {
    return document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
           document.querySelector('meta[name="application-name"]')?.getAttribute('content') ||
           new URL(window.location.href).hostname;
  }

  extractCanonicalUrl(document, url) {
    return document.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
           document.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
           url;
  }

  extractLanguage(document) {
    return document.documentElement.lang ||
           document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content') ||
           'en';
  }

  extractTags(document) {
    const tags = [];

    // Extract from keywords meta tag
    const keywordsEl = document.querySelector('meta[name="keywords"]');
    if (keywordsEl) {
      const keywords = keywordsEl.getAttribute('content');
      if (keywords) {
        tags.push(...keywords.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0));
      }
    }

    // Extract from article tags
    for (const selector of this.tagSelectors) {
      const tagElements = document.querySelectorAll(selector);
      if (tagElements.length > 0) {
        const additionalTags = Array.from(tagElements)
          .map(el => el.textContent?.trim())
          .filter(tag => tag && tag.length > 0);
        tags.push(...additionalTags);
        break;
      }
    }

    // Remove duplicates and return
    return [...new Set(tags)];
  }

  estimateReadingTime(document) {
    const contentText = document.body.textContent || '';
    const wordsPerMinute = 200; // Average reading speed
    
    // For Chinese content, count characters instead of words
    const isChinese = /[\u4e00-\u9fa5]/.test(contentText);
    
    if (isChinese) {
      const charCount = contentText.replace(/\s/g, '').length;
      const chineseWordsPerMinute = 300; // Chinese characters per minute
      return Math.ceil(charCount / chineseWordsPerMinute);
    } else {
      const wordCount = contentText.trim().split(/\s+/).length;
      return Math.ceil(wordCount / wordsPerMinute);
    }
  }

  cleanMetadata(metadata) {
    Object.keys(metadata).forEach(key => {
      if (typeof metadata[key] === 'string') {
        metadata[key] = metadata[key].trim();
      }
    });
  }
}

export default MetadataExtractor;