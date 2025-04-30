let allSymbols = null;
const trackedSymbols = new Set();

function initSearchLogic() {
  const searchInput = document.getElementById('stock-search');
  const resultsList = document.getElementById('search-results');
  const trackedList = document.getElementById('tracked-stocks');

  // Load stored symbols from chrome storage on startup
  chrome.storage.local.get(['trackedStocks'], (result) => {
    const stored = result.trackedStocks || [];
    stored.forEach(symbol => trackedSymbols.add(symbol));
    renderTrackedStocks(trackedList);
  });

  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length < 2) {
      resultsList.innerHTML = '';
      return;
    }

    const symbols = await getSymbols();
    const filtered = symbols.filter(s =>
      s.symbol.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query)
    );

    displayResults(filtered.slice(0, 5), resultsList, trackedList);
  });
}

async function getSymbols() {
  if (allSymbols) return allSymbols;
  try {
    const res = await fetch('https://psx-extension.vercel.app/getSymbols');
    allSymbols = await res.json();
    return allSymbols;
  } catch (e) {
    console.error('Failed to load symbols', e);
    return [];
  }
}

function displayResults(matches, resultsList, trackedList) {
  resultsList.innerHTML = '';

  matches.forEach(stock => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.padding = '4px 8px';
    li.style.marginBottom = '5px';

    const text = document.createElement('span');
    text.textContent = `${stock.symbol} - ${stock.name}`;

    const addBtn = document.createElement('button');
    addBtn.textContent = '➕';
    addBtn.className = 'add-btn';
    addBtn.style.marginLeft = '10px';

    // If symbol is already tracked, disable the add button
    if (trackedSymbols.has(stock.symbol)) {
      addBtn.disabled = true;
      addBtn.textContent = '✔️';
    }

    addBtn.addEventListener('click', () => {
      if (trackedSymbols.size < 3 && !trackedSymbols.has(stock.symbol)) {
        trackedSymbols.add(stock.symbol);
        renderTrackedStocks(trackedList); // Re-render list after adding
      }
    });

    li.appendChild(text);
    li.appendChild(addBtn);
    resultsList.appendChild(li);
  });
}

function renderTrackedStocks(trackedList) {
  trackedList.innerHTML = '';
  const trackedArray = Array.from(trackedSymbols);

  // Save tracked stocks to local storage
  chrome.storage.local.set({ trackedStocks: trackedArray });

  trackedArray.forEach(symbol => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.padding = '4px 8px';

    const text = document.createElement('span');
    text.textContent = symbol;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '❌';
    removeBtn.className = 'remove-btn';
    removeBtn.style.marginLeft = '10px';

    removeBtn.addEventListener('click', () => {
      trackedSymbols.delete(symbol);
      renderTrackedStocks(trackedList); // Re-render after removal
    });

    li.appendChild(text);
    li.appendChild(removeBtn);
    trackedList.appendChild(li);
  });
}


// let allSymbols = null;
// const trackedSymbols = new Set();
// function renderTrackedStocks(trackedList) {
//     trackedList.innerHTML = '';
//     const trackedArray = Array.from(trackedSymbols);
  
//     // Store updated tracked symbols
//     chrome.storage.local.set({ trackedStocks: trackedArray });
  
//     trackedArray.forEach(symbol => {
//       const li = document.createElement('li');
//       li.style.display = 'flex';
//       li.style.justifyContent = 'space-between';
//       li.style.alignItems = 'center';
//       li.style.padding = '4px 8px';
  
//       const text = document.createElement('span');
//       text.textContent = symbol;
  
//       const removeBtn = document.createElement('button');
//       removeBtn.textContent = '❌';
//       removeBtn.className = 'remove-btn';
//       removeBtn.style.marginLeft = '10px';
  
//       removeBtn.addEventListener('click', () => {
//         trackedSymbols.delete(symbol);
//         renderTrackedStocks(trackedList); // Re-render after removal
//       });
  
//       li.appendChild(text);
//       li.appendChild(removeBtn);
//       trackedList.appendChild(li);
//     });
//   }
  

// function initSearchLogic() {
//     const searchInput = document.getElementById('stock-search');
//     const resultsList = document.getElementById('search-results');
//     const trackedList = document.getElementById('tracked-stocks');
  
//     // Load stored symbols
//     chrome.storage.local.get(['trackedStocks'], (result) => {
//       const stored = result.trackedStocks || [];
//       stored.forEach(symbol => trackedSymbols.add(symbol));
//       renderTrackedStocks(trackedList);
//     });
  
//     searchInput.addEventListener('input', async (e) => {
//       const query = e.target.value.trim().toLowerCase();
//       if (query.length < 2) {
//         resultsList.innerHTML = '';
//         return;
//       }
  
//       const symbols = await getSymbols();
//       const filtered = symbols.filter(s =>
//         s.symbol.toLowerCase().includes(query) ||
//         s.name.toLowerCase().includes(query)
//       );
  
//       displayResults(filtered.slice(0, 5), resultsList, trackedList);
//     });
//   }
  

// async function getSymbols() {
//   if (allSymbols) return allSymbols;
//   try {
//     const res = await fetch('https://psx-extension.vercel.app/getSymbols');
//     allSymbols = await res.json();
//     return allSymbols;
//   } catch (e) {
//     console.error('Failed to load symbols', e);
//     return [];
//   }
// }

// function displayResults(matches, resultsList, trackedList) {
//   resultsList.innerHTML = '';

//   matches.forEach(stock => {
//     const li = document.createElement('li');
//     li.innerHTML = `
//       <span><strong>${stock.symbol}</strong> - ${stock.name}</span>
//       <button class="add-btn">➕</button>
//     `;

//     li.querySelector('.add-btn').addEventListener('click', () => {
//       if (trackedSymbols.size >= 3 || trackedSymbols.has(stock.symbol)) return;
//       trackedSymbols.add(stock.symbol);
//       renderTrackedStocks(trackedList);
//     });

//     resultsList.appendChild(li);
//   });
// }

// function renderTrackedStocks(trackedList) {
//   trackedList.innerHTML = '';
//   trackedSymbols.forEach(symbol => {
//     const li = document.createElement('li');
//     li.textContent = symbol;
//     trackedList.appendChild(li);
//   });
// }