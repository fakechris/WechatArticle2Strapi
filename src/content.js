function extractArticle() {
  const titleEl = document.querySelector('#activity-name') || 
                  document.querySelector('h2.rich_media_title') ||
                  document.querySelector('.rich_media_title');
  
  const authorEl = document.querySelector('.rich_media_meta_text') || 
                   document.querySelector('#meta_content .rich_media_meta_nickname') ||
                   document.querySelector('.account_nickname_inner');
  
  const publishTimeEl = document.querySelector('#publish_time') || 
                        document.querySelector('.rich_media_meta_text:last-child') ||
                        document.querySelector('[data-time]');
  
  const contentEl = document.querySelector('#js_content') || 
                    document.querySelector('.rich_media_content');
  
  const digestEl = document.querySelector('meta[property="og:description"]') ||
                   document.querySelector('meta[name="description"]');

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

  const canonicalEl = document.querySelector('link[rel="canonical"]');
  const url = canonicalEl ? canonicalEl.href : window.location.href;

  return {
    title: titleEl ? titleEl.innerText.trim() : '',
    author: authorEl ? authorEl.innerText.trim() : '',
    publishTime: publishTimeEl ? publishTimeEl.innerText.trim() : '',
    content: contentEl ? contentEl.innerHTML : '',
    digest: digestEl ? digestEl.getAttribute('content') : '',
    images: images,
    url: url,
    timestamp: Date.now()
  };
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
    const articleData = extractArticle();
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
