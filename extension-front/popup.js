
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



  // Initial chart
  updateChart();

  // search
  initSearchLogic();


  // Auto-update every 5 minutes
  setInterval(updateChart, 5 * 60 * 1000);
});
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

    const prices = reversedData.map(item => item[1]);

    // Build label array with hourly-only labels
    const labels = reversedData.map((item, index, arr) => {
      const currHour = new Date(item[0] * 1000).getHours();
      const prevHour = index > 0 ? new Date(arr[index - 1][0] * 1000).getHours() : null;
      return item[0]
      // return currHour !== prevHour
      //   ? `${currHour % 12 || 12} ${currHour < 12 ? 'AM' : 'PM'}`
      //   : ''; // Show only when hour changes
    });

    const trendColor = prices[0] < prices[prices.length - 1] ? 'green' : 'red';

    const ctx = document.getElementById('stockChart').getContext('2d');

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
            beginAtZero: false,
            grid: {
              color: 'transparent' // Remove y-axis grid lines
            }
          },
          x: {
            ticks: {
              callback: function (value, index, values) {
                const timestamp = Number(this.getLabelForValue(value));
                const currDate = new Date(timestamp * 1000);
                const currHour = currDate.getHours();
          
                if (index === 0) return `${currHour % 12 || 12} ${currHour < 12 ? 'AM' : 'PM'}    `;
          
                const prevTimestamp = Number(this.getLabelForValue(values[index - 1].value));
                const prevHour = new Date(prevTimestamp * 1000).getHours();
          
                if (currHour !== prevHour) {
                  return `      ${currHour % 12 || 12} ${currHour < 12 ? 'AM' : 'PM'}`;
                }
                return '';
              },
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0
            },
            grid: {
              color: 'transparent'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: function (context) {
                const timestamp = Number(context[0].label); // Convert label back to number
                const date = new Date(timestamp * 1000); // Convert to milliseconds
                const hours = date.getHours();
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const ampm = hours < 12 ? 'AM' : 'PM';
                const displayHour = hours % 12 || 12;
                return `${displayHour}:${minutes} ${ampm}`;
              }
            }
          }
        },
      }
    });
  });
}

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

// ---------
// 🔧 Function to convert UNIX time to readable format
function formatTime(unixEpoch) {
  const date = new Date(unixEpoch);
  return date.toLocaleString('en-US', {
    hour: 'numeric', hour12: true,
  });
}

// 🔧 Function to fetch data for one stock from your API
async function fetchStockData(symbol) {
  try {
    const response = await fetch(`https://psx-extension.vercel.app/stock/${symbol}`);
    console.log(`Response for ${symbol}:`, response);

    if (!response.ok) throw new Error("API error");

    const data = await response.json();
    console.log(`Data for ${symbol}:`, data);

    return data;
  } catch (error) {
    console.error(`Failed to fetch data for ${symbol}:`, error);
    return null;
  }
}


// 🚀 Main function to load and display all tracked stocks
// async function loadTrackedStocks() {
//   const container = document.getElementById('tracked-stocks');
//   container.innerHTML = ''; // Clear existing content

//   // Get tracked stock symbols from localStorage
//   const symbols = [];
//   chrome.storage.local.get(['trackedStocks'], (result) => {
//     for (const symbol of result.trackedStocks) {
//       const stockDiv = document.createElement('div');
//       stockDiv.className = 'stock-box';
//       stockDiv.innerHTML = `
//         <strong>{symbol}</strong>: Rs {currentPrice}
//         <span style="color:{isUp ? 'green' : 'red'};">
//           ({isUp ? '+' : ''}{priceDiff.toFixed(2)})
//         </span>
//         <br><small>As of {formatTime(lastUpdated)}</small>
//       `;

//       container.appendChild(stockDiv);
//     }

//   })


// }
