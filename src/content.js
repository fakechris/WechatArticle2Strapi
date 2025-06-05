function extractArticle() {
  const titleEl = document.querySelector('#activity-name') || document.querySelector('h2.rich_media_title');
  const authorEl = document.querySelector('.rich_media_meta rich_media_meta_text') || document.querySelector('#meta_content span');
  const publishTimeEl = document.querySelector('#publish_time') || document.querySelector('.rich_media_meta_text');
  const contentEl = document.querySelector('#js_content');
  const digestEl = document.querySelector('meta[property="og:description"]');

  return {
    title: titleEl ? titleEl.innerText.trim() : '',
    author: authorEl ? authorEl.innerText.trim() : '',
    publishTime: publishTimeEl ? publishTimeEl.innerText.trim() : '',
    content: contentEl ? contentEl.innerHTML : '',
    digest: digestEl ? digestEl.getAttribute('content') : ''
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'extract') {
    sendResponse(extractArticle());
  }
});
