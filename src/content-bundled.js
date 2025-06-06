import Defuddle from 'defuddle';

// Add debug information to verify Defuddle is loaded
console.log('Defuddle imported:', typeof Defuddle);
console.log('Defuddle class:', Defuddle);

// Enhanced content extraction using Defuddle for superior content filtering
function extractArticle() {
  try {
    // Check if we're on a WeChat article page
    const isWeChatArticle = window.location.hostname === 'mp.weixin.qq.com';
    
    console.log('Starting extraction. WeChat article:', isWeChatArticle);
    
    if (isWeChatArticle) {
      // Use enhanced WeChat-specific extraction
      return extractWeChatArticle();
    } else {
      // Use Defuddle for general web content extraction
      return extractGeneralContent();
    }
  } catch (error) {
    console.error('Content extraction failed:', error);
    // Fallback to basic extraction
    return extractBasicContent();
  }
}

function extractWeChatArticle() {
  // Enhanced WeChat extraction that first tries Defuddle, then falls back to specific selectors
  console.log('Extracting WeChat article with Defuddle enhancement');
  
  try {
    // Try Defuddle first even for WeChat articles to get better content filtering
    console.log('Trying Defuddle for WeChat article...');
    const defuddle = new Defuddle(document, {
      debug: true, // Enable debug for troubleshooting
      removeExactSelectors: true,
      removePartialSelectors: true
    });
    
    const result = defuddle.parse();
    console.log('WeChat Defuddle result:', result);
    
    // If Defuddle found good content, enhance it with WeChat-specific metadata
    if (result && result.content && result.content.length > 100) {
      console.log('Using Defuddle result for WeChat, content length:', result.content.length);
      return enhanceWithWeChatMetadata(result);
    } else {
      console.log('Defuddle result not good enough for WeChat, falling back');
    }
  } catch (error) {
    console.log('Defuddle extraction failed for WeChat, falling back to selectors:', error);
  }
  
  // Fallback to original WeChat selectors if Defuddle didn't work well
  console.log('Using WeChat selector fallback');
  const titleEl = document.querySelector('#activity-name') || 
                  document.querySelector('.rich_media_title') ||
                  document.querySelector('h1');
  
  const authorEl = document.querySelector('#js_name') ||
                   document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('.account_nickname_inner');
  
  const publishTimeEl = document.querySelector('#publish_time') ||
                        document.querySelector('.rich_media_meta_text');
  
  const contentEl = document.querySelector('#js_content') ||
                    document.querySelector('.rich_media_content');
  
  const digestEl = document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('meta[name="description"]');
  
  // Extract images
  const images = [];
  if (contentEl) {
    const imgElements = contentEl.querySelectorAll('img[data-src], img[src]');
    imgElements.forEach((img, index) => {
      const src = img.getAttribute('data-src') || img.src;
      if (src && !src.startsWith('data:')) {
        images.push({
          src: src,
          alt: img.alt || '',
          index: index
        });
      }
    });
  }

  return {
    title: titleEl ? titleEl.innerText.trim() : '',
    author: authorEl ? authorEl.innerText.trim() : '',
    publishTime: publishTimeEl ? publishTimeEl.innerText.trim() : '',
    content: contentEl ? contentEl.innerHTML : '',
    digest: digestEl ? (digestEl.content || digestEl.innerText || '').trim() : '',
    images: images,
    url: window.location.href,
    timestamp: Date.now(),
    extractionMethod: 'wechat-fallback'
  };
}

function enhanceWithWeChatMetadata(defuddleResult) {
  // Get WeChat-specific metadata and combine with Defuddle's cleaned content
  const authorEl = document.querySelector('#js_name') ||
                   document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('.account_nickname_inner');
  
  const publishTimeEl = document.querySelector('#publish_time') ||
                        document.querySelector('.rich_media_meta_text');
  
  const digestEl = document.querySelector('.rich_media_meta_text') ||
                   document.querySelector('meta[name="description"]');

  // Extract images from the cleaned content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = defuddleResult.content;
  const imgElements = tempDiv.querySelectorAll('img');
  const images = [];
  
  imgElements.forEach((img, index) => {
    const src = img.getAttribute('data-src') || img.src;
    if (src && !src.startsWith('data:')) {
      images.push({
        src: src,
        alt: img.alt || '',
        index: index
      });
    }
  });

  return {
    title: defuddleResult.title || '',
    author: defuddleResult.author || (authorEl ? authorEl.innerText.trim() : ''),
    publishTime: defuddleResult.published || (publishTimeEl ? publishTimeEl.innerText.trim() : ''),
    content: defuddleResult.content || '',
    digest: defuddleResult.description || (digestEl ? (digestEl.content || digestEl.innerText || '').trim() : ''),
    images: images,
    url: defuddleResult.url || window.location.href,
    timestamp: Date.now(),
    extractionMethod: 'defuddle-enhanced-wechat',
    wordCount: defuddleResult.wordCount || 0,
    parseTime: defuddleResult.parseTime || 0,
    domain: defuddleResult.domain || '',
    site: defuddleResult.site || ''
  };
}

function extractGeneralContent() {
  // Use Defuddle for general web content extraction
  console.log('Extracting general content with Defuddle');
  console.log('Defuddle constructor available:', typeof Defuddle);
  
  try {
    console.log('Creating Defuddle instance...');
    const defuddle = new Defuddle(document, {
      debug: true, // Enable debug for troubleshooting
      removeExactSelectors: true,
      removePartialSelectors: true
    });
    
    console.log('Defuddle instance created, calling parse...');
    const result = defuddle.parse();
    console.log('Defuddle parse result:', result);
    console.log('Content length:', result?.content?.length || 0);
    
    if (!result || !result.content || result.content.length < 50) {
      console.log('Defuddle extraction yielded poor results, falling back');
      console.log('Result details:', {
        hasResult: !!result,
        hasContent: !!result?.content,
        contentLength: result?.content?.length || 0
      });
      return extractBasicContent();
    }
    
    console.log('Defuddle extraction successful, processing images...');
    
    // Extract images from the cleaned content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.content;
    const imgElements = tempDiv.querySelectorAll('img');
    const images = [];
    
    imgElements.forEach((img, index) => {
      if (img.src && !img.src.startsWith('data:')) {
        images.push({
          src: img.src,
          alt: img.alt || '',
          index: index
        });
      }
    });
    
    const finalResult = {
      title: result.title || document.title || '',
      author: result.author || '',
      publishTime: result.published || '',
      content: result.content || '',
      digest: result.description || '',
      images: images,
      url: result.url || window.location.href,
      timestamp: Date.now(),
      extractionMethod: 'defuddle',
      wordCount: result.wordCount || 0,
      parseTime: result.parseTime || 0,
      domain: result.domain || '',
      site: result.site || ''
    };
    
    console.log('Final Defuddle result:', {
      method: finalResult.extractionMethod,
      titleLength: finalResult.title.length,
      contentLength: finalResult.content.length,
      imageCount: finalResult.images.length
    });
    
    return finalResult;
  } catch (error) {
    console.error('Defuddle extraction failed:', error);
    console.error('Error stack:', error.stack);
    return extractBasicContent();
  }
}

function extractBasicContent() {
  // Basic fallback extraction for when Defuddle is not available or fails
  console.log('Using basic content extraction fallback');
  
  // Try to find the main content area
  const contentSelectors = [
    'article',
    'main',
    '.content',
    '.post-content',
    '.article-content',
    '.entry-content',
    '#content',
    '.main-content',
    '[role="main"]'
  ];
  
  let contentEl = null;
  for (const selector of contentSelectors) {
    contentEl = document.querySelector(selector);
    if (contentEl && contentEl.innerText.length > 200) {
      console.log('Found content with selector:', selector);
      break;
    }
  }
  
  // If no good content area found, try to get the largest text block
  if (!contentEl) {
    console.log('No good content selector found, trying largest text block...');
    const allDivs = document.querySelectorAll('div, section, article');
    let maxLength = 0;
    for (const div of allDivs) {
      const textLength = div.innerText ? div.innerText.length : 0;
      if (textLength > maxLength && textLength > 200) {
        maxLength = textLength;
        contentEl = div;
      }
    }
    console.log('Largest text block length:', maxLength);
  }
  
  // Get images from the content area
  const images = [];
  if (contentEl) {
    const imgElements = contentEl.querySelectorAll('img');
    imgElements.forEach((img, index) => {
      if (img.src && !img.src.startsWith('data:')) {
        images.push({
          src: img.src,
          alt: img.alt || '',
          index: index
        });
      }
    });
  }
  
  // Get title
  const title = document.querySelector('h1')?.innerText?.trim() || 
                document.title || 
                '';
  
  // Get meta description
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                   document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                   '';
  
  const basicResult = {
    title: title,
    author: '',
    publishTime: '',
    content: contentEl ? contentEl.innerHTML : '',
    digest: metaDesc,
    images: images,
    url: window.location.href,
    timestamp: Date.now(),
    extractionMethod: 'basic-fallback'
  };
  
  console.log('Basic extraction result:', {
    method: basicResult.extractionMethod,
    titleLength: basicResult.title.length,
    contentLength: basicResult.content.length,
    imageCount: basicResult.images.length
  });
  
  return basicResult;
}

async function downloadImage(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'extract') {
    console.log('Received extract request');
    const articleData = extractArticle();
    console.log('Extracted article data:', {
      method: articleData.extractionMethod,
      title: articleData.title,
      contentLength: articleData.content ? articleData.content.length : 0,
      wordCount: articleData.wordCount,
      imageCount: articleData.images ? articleData.images.length : 0
    });
    sendResponse(articleData);
  } else if (msg.type === 'downloadImage') {
    downloadImage(msg.url).then(dataUrl => {
      sendResponse({ success: true, dataUrl });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Add debug information to console
console.log('Enhanced Smart Article Extractor content script loaded with Defuddle support');
console.log('Current domain:', window.location.hostname);
console.log('Defuddle available at load:', typeof Defuddle); 