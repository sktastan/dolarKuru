const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path'); // Import the 'path' module

const app = express();
const PORT = process.env.PORT || 3001;

// CORS options
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.static('public'));

// Cache variables
let cachedDollarData = null;

// Function to fetch and update the dollar values
async function fetchAndUpdateDollarValues() {
  // console.log("Fetching new dollar values...");
  const url = 'https://uzmanpara.milliyet.com.tr/dolar-kuru/';

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    // console.log("Data fetched successfully. Status:", response.status);

    if (response.status !== 200) {
      // console.error("Request failed with status:", response.status);
      return;
    }

    const $ = cheerio.load(response.data);

    // Corrected Cheerio selectors for Alış and Satış
    const alisElement = $('table:nth-child(1) tbody tr:nth-child(2) td:nth-child(3)');
    const satisElement = $('table:nth-child(1) tbody tr:nth-child(2) td:nth-child(4)');

    if (alisElement.length === 0 || satisElement.length === 0) {
      // console.error("Could not find the dollar value elements on the page.");
      return;
    }

    const alisValue = alisElement.text().trim();
    const satisValue = satisElement.text().trim();

    if (!alisValue || !satisValue) {
      // console.error("Could not find dollar values on the page.");
      return;
    }

    // Update cache with both values
    cachedDollarData = { alis: alisValue, satis: satisValue };
    // console.log("Dollar values updated in cache:", cachedDollarData);

  } catch (error) {
    // console.error('Error fetching or parsing data:', error);
  }
}

// Set up the interval to fetch and update the dollar values every 10 seconds
// const fetchInterval = 10 * 1000;
// setInterval(fetchAndUpdateDollarValues, fetchInterval);

// Initial fetch
// fetchAndUpdateDollarValues();

app.get('/api/dollar-value', (req, res) => {
  fetchAndUpdateDollarValues();
  // console.log("Request received for /api/dollar-value");
  if (cachedDollarData) {
    // console.log("Serving from cache");
    res.json(cachedDollarData);
  } else {
    console.log("No data in cache yet.");
    res.status(503).json({ error: 'Data not available yet.' });
  }
});

// New route handler for the root path (/)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Basic error handling for other routes
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});