const API_URL = 'https://psx-extension.vercel.app/kse100'; // Replace with real API!
// const STOCK_URL = 'https://dps.psx.com.pk/timeseries/int/HBL'; // Replace with real API!

const ALERT_PRICE = 155; // Target price for HBL
let indexData;

async function fetchData() {
  try {
    // Fetch KSE-100
    const indexResponse = await fetch(API_URL);
    indexData = await indexResponse.json();
    const kseIndex = Math.round(indexData['data'][0][1]);
    const startOfDayIndex = Math.round(indexData['data'].pop()[1]);
    chrome.storage.local.set({ 'kse100': indexData['data'][0] });

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

// Set alarm to fetch every 1 minute
chrome.alarms.create('fetchKSE', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener(fetchData);
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background:", request);
  console.log(indexData['data']);
  if (request.type === 'getStockData') {
    sendResponse({ data:indexData['data']});
  }
  return true; // or false if response is synchronous
});
fetchData();






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
