document.getElementById('extract').addEventListener('click', () => {
  document.getElementById('status').textContent = 'Extracting...';
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'extract' }, article => {
      if (!article) {
        document.getElementById('status').textContent = 'Extraction failed';
        return;
      }
      chrome.runtime.sendMessage({ type: 'sendToStrapi', article }, response => {
        if (response && response.success) {
          document.getElementById('status').textContent = 'Upload success';
        } else {
          document.getElementById('status').textContent = 'Upload failed: ' + (response && response.error);
        }
      });
    });
  });
});
