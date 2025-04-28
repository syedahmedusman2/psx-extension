// const API_URL = 'https://dps.psx.com.pk/timeseries/int/KSE100'; // Replace with real API!
const API_URL = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://dps.psx.com.pk/timeseries/int/KSE100');

const STOCK_URL = 'https://dps.psx.com.pk/timeseries/int/HBL'; // Replace with real API!

const ALERT_PRICE = 155; // Target price for HBL

async function fetchData() {
  try {
    // Fetch KSE-100
    const indexResponse = await fetch(API_URL, { mode: 'no-cors' });
    console.log('Index Response:', indexResponse);
    // const indexData = await indexResponse.json();
    // const kseIndex = Math.round(indexData.indexValue);

    // Update badge
    chrome.action.setBadgeText({ text: "kseIndex.toString()" });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });

    // Fetch HBL stock
    const stockResponse = await fetch(STOCK_URL, { mode: 'no-cors' });
    // const stockData = await stockResponse.json();
    // const hblPrice = stockData.price;

    // Save data
    // chrome.storage.local.set({ kseIndex, hblPrice });

    // Check for alert
    // if (hblPrice > ALERT_PRICE) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Stock Alert!',
        message: `HBL has crossed Rs ${ALERT_PRICE}: Current Rs 122`
      });
    // }

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Set alarm to fetch every 1 minute
chrome.alarms.create('fetchKSE', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(fetchData);

// Fetch immediately on start
fetchData();