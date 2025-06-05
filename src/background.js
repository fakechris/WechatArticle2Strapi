async function sendToStrapi(article) {
  const config = await chrome.storage.sync.get(['strapiUrl', 'token', 'collection']);
  const endpoint = `${config.strapiUrl}/api/${config.collection}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`
    },
    body: JSON.stringify({ data: article })
  });

  if (!res.ok) {
    throw new Error(`Strapi error: ${res.status}`);
  }

  return res.json();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'sendToStrapi') {
    sendToStrapi(msg.article)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open
  }
});
