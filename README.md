# 🔨 Baumarkt Price Scraper (EAN)

Apify Actor that scrapes product prices from **Hornbach**, **OBI**, **Bauhaus**, **Globus Baumarkt** and **Amazon.de** by EAN/GTIN barcode.

## Output Example

```json
[
  {
    "ean": "4007430162632",
    "shop": "hornbach",
    "productName": "Fischer Dübel SX Plus 8x40 mm",
    "price": 4.99,
    "currency": "EUR",
    "productUrl": "https://www.hornbach.at/...",
    "inStock": true,
    "scrapedAt": "2025-06-01T10:23:45.000Z"
  }
]
```

## Setup & Deploy

### 1. Prerequisites
- [Apify CLI](https://docs.apify.com/cli): `npm install -g apify-cli`
- Apify account with API token

### 2. Login
```bash
apify login
```

### 3. Deploy to Apify Cloud
```bash
apify push
```

### 4. Run locally (for testing)
```bash
npm install
apify run
```
Results land in `./storage/datasets/price-results/`.

## Input

| Parameter | Type | Default | Description |
|---|---|---|---|
| `eans` | string[] | **required** | List of EAN/GTIN codes |
| `shops` | string[] | all shops | Which shops to scrape |
| `maxConcurrency` | int | 3 | Parallel browser tabs |
| `requestTimeoutSecs` | int | 30 | Timeout per page |

## Tips

### Amazon needs Proxies
Amazon aggressively blocks scrapers. In Apify, go to your Actor settings and enable **Residential Proxies** for the Amazon shop. The other Baumärkte generally work without proxies.

### Selectors break
Shop websites update their HTML regularly. If a shop stops returning prices, the CSS selectors in `src/scrapers/<shop>.js` likely need updating. Use Chrome DevTools to find the current price element.

### Scaling
For bulk EAN lists (100+), increase `memoryMbytes` to 4096 in `.actor/actor.json` and set `maxConcurrency` to 5.

## Project Structure

```
├── .actor/
│   ├── actor.json          # Actor metadata
│   └── input_schema.json   # Input validation & UI
├── src/
│   ├── main.js             # Actor entrypoint
│   ├── scrapers/
│   │   ├── index.js        # Scraper registry
│   │   ├── hornbach.js
│   │   ├── obi.js
│   │   ├── bauhaus.js
│   │   ├── globus.js
│   │   └── amazon.js
│   └── utils/
│       ├── urlBuilder.js   # EAN → search URL mapping
│       └── priceParser.js  # Price string → float
├── Dockerfile
├── package.json
└── storage/
    └── key_value_stores/default/INPUT.json  # local test input
```
