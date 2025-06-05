function load() {
  chrome.storage.sync.get(['strapiUrl', 'token', 'collection'], data => {
    document.getElementById('strapiUrl').value = data.strapiUrl || '';
    document.getElementById('token').value = data.token || '';
    document.getElementById('collection').value = data.collection || '';
  });
}

function save() {
  const data = {
    strapiUrl: document.getElementById('strapiUrl').value,
    token: document.getElementById('token').value,
    collection: document.getElementById('collection').value
  };
  chrome.storage.sync.set(data, () => {
    document.getElementById('status').textContent = 'Saved';
  });
}

document.getElementById('save').addEventListener('click', save);

document.addEventListener('DOMContentLoaded', load);
