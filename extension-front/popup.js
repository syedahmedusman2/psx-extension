document.addEventListener('DOMContentLoaded', function () {
  console.log("I am Working popup js");
  chrome.storage.local.get(['kse100']).then((result) => {
    console.log("Value is from pop.js " + result.kse100);
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
});
