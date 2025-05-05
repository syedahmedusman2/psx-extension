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
    li.style.listStyleType = 'none';
    li.style.marginBottom = '12px';
    li.style.padding = '12px';
    li.style.border = '1px solid #ddd';
    li.style.borderRadius = '8px';
    li.style.backgroundColor = '#f9f9f9';
    li.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';

    // --- Header Row (Symbol + Remove) ---
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';
    topRow.style.marginBottom = '6px';

    const text = document.createElement('span');
    text.style.fontWeight = 'bold';
    text.style.fontSize = '16px';
    text.textContent = symbol;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'x';
    removeBtn.className = 'remove-btn';
    removeBtn.style.border = 'none';
    removeBtn.style.background = '#e74c3c';
    removeBtn.style.color = 'white';
    removeBtn.style.borderRadius = '50%';
    removeBtn.style.width = '20px';
    removeBtn.style.height = '20px';
    removeBtn.style.fontSize = '12px';
    removeBtn.style.cursor = 'pointer';

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      trackedSymbols.delete(symbol);
      // Remove alert
      chrome.storage.local.get(['alerts'], (res) => {
        const alerts = res.alerts || {};
        delete alerts[symbol];
        chrome.storage.local.set({ alerts });
      });
      renderTrackedStocks(trackedList);
    });

    topRow.appendChild(text);
    topRow.appendChild(removeBtn);
    li.appendChild(topRow);

    // --- Price Info ---
    const stockData = await fetchStockData(symbol);
    const stockPrice = document.createElement('div');
    stockPrice.innerHTML = `
    <strong style="font-size: 14px;">Price: Rs ${stockData['data'][0][1]}</strong><br>
    <span style="color: gray; font-size: 11px;">As of ${formatUnixTime(stockData['data'][0][0])}</span>
  `;
    stockPrice.style.marginBottom = '8px';
    li.appendChild(stockPrice);

    // --- Alert Input Field ---
    const alertContainer = document.createElement('div');
    alertContainer.style.display = 'flex';
    alertContainer.style.alignItems = 'center';
    alertContainer.style.gap = '8px';
    alertContainer.style.marginTop = '6px';

    // Input field (already created)
    const inputField = document.createElement('input');
    inputField.type = 'number';
    inputField.placeholder = 'Alert Price';
    inputField.style.width = '40%';
    inputField.style.padding = '6px 8px';
    inputField.style.border = '1px solid #ccc';
    inputField.style.borderRadius = '6px';
    inputField.style.fontSize = '12px';
    inputField.style.outline = 'none';
    inputField.style.boxSizing = 'border-box';

    // Button
    const setAlertBtn = document.createElement('button');
    const removeAlertBtn = document.createElement('button');
    setAlertBtn.textContent = 'Set Alert';
    setAlertBtn.style.padding = '6px 10px';
    setAlertBtn.style.backgroundColor = '#007bff';
    setAlertBtn.style.color = 'white';
    setAlertBtn.style.border = 'none';
    setAlertBtn.style.borderRadius = '6px';
    setAlertBtn.style.cursor = 'pointer';
    setAlertBtn.style.fontSize = '11px';
    // remove
    removeAlertBtn.textContent = 'Clear Alert';
    removeAlertBtn.style.padding = '6px 10px';
    removeAlertBtn.style.backgroundColor = 'red';
    removeAlertBtn.style.color = 'white';
    removeAlertBtn.style.border = 'none';
    removeAlertBtn.style.borderRadius = '6px';
    removeAlertBtn.style.cursor = 'pointer';
    removeAlertBtn.style.fontSize = '11px';

    // Load saved alert value if available
    chrome.storage.local.get(['alerts'], (res) => {
      const alerts = res.alerts || {};
      if (alerts[symbol]) {
        inputField.value = alerts[symbol];
      }
    });

    // Save on button click
    setAlertBtn.addEventListener('click', () => {
      const alertPrice = parseFloat(inputField.value);
      if (!isNaN(alertPrice)) {
        chrome.storage.local.get(['alerts'], (res) => {
          const alerts = res.alerts || {};
          alerts[symbol] = alertPrice;
          chrome.storage.local.set({ alerts });
        });
      }
    });

    removeAlertBtn.addEventListener('click', () => {
      const alertPrice = parseFloat(inputField.value);
      if (!isNaN(alertPrice)) {
        chrome.storage.local.get(['alerts'], (res) => {
          const alerts = res.alerts || {};
          delete alerts[symbol];
          chrome.storage.local.set({ alerts });
        });
        inputField.value = '';
      }
    });

    // Append input + button to wrapper
    alertContainer.appendChild(inputField);
    alertContainer.appendChild(setAlertBtn);
    alertContainer.appendChild(removeAlertBtn);
    li.appendChild(alertContainer);

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
}
