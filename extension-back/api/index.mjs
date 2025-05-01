import fetch from 'node-fetch';  // fetch() support in Node
import express from 'express'

const PORT = process.env.PORT || 3000;
const app = express()
// Allow CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');  // Allow any origin
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
const previousClose = '114872.18';
app.get('/kse100', async (req, res) => {
  try {
    const response = await fetch('https://dps.psx.com.pk/timeseries/int/KSE100');
    let data = await response.json();
    data["previousClose"] = previousClose; // Adds the key "1stKey" with the value "value"
    res.json(data); // Send the data to the client
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch data` });
  }
});

app.get('/stock/:symbol', async (req, res) => {
  const { symbol } = req.params; // Get the symbol from URL

  try {
    const url = `https://dps.psx.com.pk/timeseries/int/${symbol.toUpperCase()}`; // Build dynamic URL
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

app.get('/getSymbols', async (req, res) => {
  try {
    const response = await fetch('https://dps.psx.com.pk/symbols');
    const data = await response.json();
    res.json(data); // Send the data to the client
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});





app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;




// const express = require("express");

// app.get("/", (req, res) => res.send("Express on Vercel"));
// app.listen(3000, () => console.log("Server ready on port 3000."));

// module.exports = app;