
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");
  const kseEl = document.getElementById("kse100-value");
  const lastUpdatedEl = document.getElementById('last-updated');
  if (kseEl) {
    chrome.storage.local.get(['kse100'], (result) => {
      if (result.kse100) {
        kseEl.textContent = `${result.kse100[1]}`;
        lastUpdatedEl.innerText = `As of ${formatUnixTime(result.kse100[0])}`;
      } else {
        console.warn("KSE-100 value not found in storage");
      }
    });
  }
  
  // Chart Logic
  let chartInstance;

  function updateChart() {
    chrome.runtime.sendMessage({ type: 'getStockData' }, (response) => {
      const rawData = response?.data;

      if (!rawData || !rawData.length) {
        console.error('No stock data received', response);
        return;
      }

      const reversedData = [...rawData].reverse();
      const labels = reversedData.map((_, i) => `T${i}`);
      const prices = reversedData.map(item => item[1]);
      const trendColor = prices[0] < prices[prices.length - 1] ? 'green' : 'red';

      const ctx = document.getElementById('stockChart').getContext('2d');

      // Destroy old chart if exists
      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Price',
            data: prices,
            borderColor: trendColor,
            borderWidth: 0.3,
            backgroundColor: 'rgba(0,0,0,0)',
            tension: 0.3,
            pointRadius: 2
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: false
            }
          }
        }
      });
    });
  }

  // Initial chart
  updateChart();

  // search
  initSearchLogic();

  // Auto-update every 5 minutes
  setInterval(updateChart, 5 * 60 * 1000);
});


// ------ Utils ---------
function formatUnixTime(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  const options = {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    hour12: true
  };
  return date.toLocaleString('en-US', options);
}