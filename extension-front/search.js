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

async function renderTrackedStocks(trackedList) {
  trackedList.innerHTML = '';

  const trackedArray = Array.from(trackedSymbols);

  // Save tracked stocks to local storage
  chrome.storage.local.set({ trackedStocks: trackedArray });
  for (const symbol of trackedArray) {
    const li = document.createElement('li');
    li.style.listStyleType = 'none'; // for <li>
    li.style.margin = '0';
    li.style.padding = '3px';
    li.style.borderBottom = '1px solid #ccc';
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center'; // This vertically centers children
    // --- Header Row (Symbol + Remove) ---
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';

    const text = document.createElement('span');
    text.textContent = symbol;

    // Make the whole item clickable
    li.addEventListener('click', () => {
      window.open(`https://dps.psx.com.pk/company/${symbol}`, '_blank');
    });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'x';
    removeBtn.className = 'remove-btn';
    removeBtn.style.marginLeft = '6px';
    


    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      trackedSymbols.delete(symbol);
      renderTrackedStocks(trackedList);
    });

    topRow.appendChild(text);
    topRow.appendChild(removeBtn);
    li.appendChild(topRow);

    // --- Price Info (next line) ---
    const stockData = await fetchStockData(symbol);
    const stockPrice = document.createElement('div');
    stockPrice.innerHTML = `
  <strong>Price: Rs ${stockData['data'][0][1]}</strong><br>
  <span style="color: gray; font-size: 10px;">As of ${formatUnixTime(stockData['data'][0][0])}</span>
`;
    // stockPrice.textContent = `Price: ${stockData['data'][0][1]} As of ${formatUnixTime(stockData['data'][0][0])}`;
    stockPrice.style.marginTop = '4px';
    stockPrice.style.fontSize = '14px';
    stockPrice.style.color = '#444';
    li.appendChild(stockPrice);

    trackedList.appendChild(li);
  }


  async function fetchStockData(symbol) {
    try {
      const response = await fetch(`https://psx-extension.vercel.app/stock/${symbol}`);
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      return null;
    }
  }

  function formatUnixTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const options = {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
      hour12: true
    };
    return date.toLocaleString('en-US', options);
  }
  // trackedArray.forEach(symbol => {
  //   const li = document.createElement('li');
  //   li.style.display = 'flex';
  //   li.style.justifyContent = 'space-between';
  //   li.style.alignItems = 'center';
  //   li.style.padding = '4px 8px';
  //   const text = document.createElement('span');
  //   text.textContent = symbol;

  //   const removeBtn = document.createElement('button');
  //   removeBtn.textContent = '❌';
  //   removeBtn.className = 'remove-btn';
  //   removeBtn.style.marginLeft = '10px';

  //   removeBtn.addEventListener('click', () => {
  //     trackedSymbols.delete(symbol);
  //     renderTrackedStocks(trackedList); // Re-render after removal
  //   });

  //   li.appendChild(text);
  //   li.appendChild(removeBtn);
  //   trackedList.appendChild(li);
  // });
}
