const API_URL = 'https://psx-extension.vercel.app/kse100'; // Replace with real API!
// const STOCK_URL = 'https://dps.psx.com.pk/timeseries/int/HBL'; // Replace with real API!

let indexData;

async function fetchData() {
  try {
    // Fetch KSE-100
    const indexResponse = await fetch(API_URL);
    indexData = await indexResponse.json();
    const kseIndex = Math.round(indexData['data'][0][1]);
    const startOfDayIndex = Math.round(indexData['previousClose']);
    chrome.storage.local.set({ 'kse100': indexData['data'][0] });
    chrome.storage.local.set({ 'kse100': indexData['data'][0] });
    chrome.storage.local.set({ 'previousClosing': startOfDayIndex });

    // console.log(`These are the symbols saved ${symbols}`)
    // badge logics
    if (indexData != undefined && indexData != null) {
      if (!isNaN(kseIndex)) {
        const badgeText = formatBadgePercent(kseIndex, startOfDayIndex);
        chrome.action.setBadgeText({ text: `${badgeText}%` });
        chrome.action.setBadgeBackgroundColor({
          color: kseIndex >= startOfDayIndex ? '#006400' : '#8B0000' // dark green / dark red
        });

        // Show full info on hover
        chrome.action.setTitle({
          title: `KSE-100: ${kseIndex}\nChange: ${(kseIndex - startOfDayIndex).toFixed(2)} (${((kseIndex - startOfDayIndex) / startOfDayIndex * 100).toFixed(2)}%)`
        });
      }

    }

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function getAlertValues() {
  chrome.storage.local.get(['alerts'], (res) => {
    const alerts = res.alerts || {};
    console.log("Alerts:", alerts['SSGC']);

    (async () => {
      for (const symbol in alerts) {
        const alertPrice = alerts[symbol];
        console.log(`Alert for ${symbol}: ${alertPrice}`);
        const stockData = await fetchStockData(symbol);
        console.log(`Price for ${symbol}: ${stockData['data'][0][1]}`);
        // Check for notification display
        if (stockData && stockData['data'][0][1] >= alertPrice) {
          console.log(`Alert triggered for ${symbol}: ${stockData['data'][0][1]} >= ${alertPrice}`);
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'PSX Pulse.png',
            title: `Alert for ${symbol}`,
            message: `Price reached: ${stockData['data'][0][1]}`,
            priority: 2
          });
          // Remove the alert after triggering
          delete alerts[symbol];
        }
      }
    })();
  });
}

async function getInitialData() {
  try {
    const indexResponse = await fetch('https://psx-extension.vercel.app/getPreviousClose');
    const previousCloseData = await indexResponse.json();
    

    fetchData();
  } catch (error) {
    console.error('Error fetching initial data:', error);
  }
}


// Set alarm to fetch every 1 minute
chrome.alarms.create('fetchKSE', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener(fetchData);
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log("Message received in background:", request);

//   if (request.type === 'getStockData') {
//     if (indexData && indexData['data'] && indexData['data'].length) {
//       sendResponse({ data: indexData['data'] });
//     } else {
//       // Delay and retry once
//       setTimeout(() => {
//         sendResponse({ data: indexData['data'] || [] });
//       }, 300); // Give it a small delay (300ms)
//     }
//     return true; // Keep the message channel open for async response
//   }
// });

fetchData();
getAlertValues();






// ------- Utils ----------
function formatBadgePercent(current, start) {
  const cur = Number(current);
  const base = Number(start);

  if (isNaN(cur) || isNaN(base) || base === 0) return '';

  const diff = cur - base;
  const percent = (diff / base) * 100;
  const rounded = Math.abs(percent).toFixed(1); // e.g. 2.3
  const arrow = percent >= 0 ? '+' : '-';

  // Badge: arrow + percent (e.g. ↑2.3)
  return `${arrow}${rounded}`.slice(0, 4);
}

async function fetchStockData(symbol) {
  try {
    const response = await fetch(`https://psx-extension.vercel.app/stock/${symbol}`);
    console.log(`Response for ${symbol}:`, response);

    if (!response.ok) throw new Error("API error");

    const data = await response.json();

    return data;
  } catch (error) {
    console.error(`Failed to fetch data for ${symbol}:`, error);
    return null;
  }
}