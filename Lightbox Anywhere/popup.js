/* Injects lightbox script and styles into the active tab using MV3 chrome.scripting */
function withActiveTab(cb) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs && tabs[0]) cb(tabs[0]);
  });
}
document.getElementById('enable').addEventListener('click', () => {
  withActiveTab((tab) => {
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content.css']
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('insertCSS error', chrome.runtime.lastError);
      }
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn('executeScript error', chrome.runtime.lastError);
        }
        window.close(); // optional: close popup after enabling
      });
    });
  });
});
