chrome.storage.local.get(['kseIndex', 'hblPrice'], (result) => {
    if (result.kseIndex) {
      document.getElementById('kse').innerText = `KSE-100: ${result.kseIndex}`;
    }
    if (result.hblPrice) {
      document.getElementById('hbl').innerText = `HBL: Rs ${result.hblPrice}`;
    }
  });
  