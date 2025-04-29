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

  // chrome.storage.local.get(['kse100'], (result) => {
  //   console.log(`!!!!!!!! ${JSON.stringify(result)}`);
    
  //   if (result.kse100) {
  //     const kseElem = document.getElementById('kse100');
  //     if (kseElem) {
  //       kseElem.innerText = `KSE-100: ${result.kse100}`;
  //     } else {
  //       console.warn("Element #kse100 not found in DOM");
  //     }
  //   }

  //   // Uncomment this block if you later add HBL display
  //   // if (result.hblPrice) {
  //   //   const hblElem = document.getElementById('hbl');
  //   //   if (hblElem) {
  //   //     hblElem.innerText = `HBL: Rs ${result.hblPrice}`;
  //   //   }
  //   // }
  // });
// });
