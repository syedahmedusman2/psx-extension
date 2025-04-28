import express from 'express';
import fetch from 'node-fetch';  // fetch() support in Node

const app = express();
const PORT = process.env.PORT || 3000;

// Allow CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');  // Allow any origin
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/kse100', async (req, res) => {
  try {
    const response = await fetch('https://dps.psx.com.pk/timeseries/int/KSE100');
    const data = await response.json();
    res.json(data); // Send the data to the client
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.get('/stock/:symbol', async (req, res) => {
    const { symbol } = req.params; // Get the symbol from URL
  
    try {
      const url = `https://dps.psx.com.pk/timeseries/int/${symbol}`; // Build dynamic URL
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch data from PSX' });
      }
  
      const data = await response.json();
      res.json(data); // Send the fetched stock data
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error while fetching stock data' });
    }
  });
  



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
