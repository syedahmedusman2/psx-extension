document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");
  const kseEl = document.getElementById("kse100-value");
  if (kseEl) {
    chrome.storage.local.get(['kse100'], (result) => {
      if (result.kse100) {
        kseEl.textContent = `KSE-100: ${result.kse100}`;
      } else {
        console.warn("KSE-100 value not found in storage");
      }
    });
  }
});
