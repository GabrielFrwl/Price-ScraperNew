import { Actor } from 'apify';
import { PlaywrightCrawler, sleep } from 'crawlee';
import { scrapers } from './scrapers/index.js';
import { buildSearchUrls } from './utils/urlBuilder.js';

await Actor.init();

const input = await Actor.getInput();
const {
    eans = [],
    shops = ['hornbach', 'globus', 'amazon', 'obi', 'bauhaus'],
    maxConcurrency = 3,
    requestTimeoutSecs = 30,
} = input;

if (!eans.length) {
    throw new Error('No EANs provided in input!');
}

console.log(`🔍 Starting price scraper for ${eans.length} EAN(s) across ${shops.length} shop(s)`);

const dataset = await Actor.openDataset('price-results');
const requestQueue = await Actor.openRequestQueue();

// Build all search URLs for each EAN × shop combination
const requests = buildSearchUrls(eans, shops);
console.log(`📋 Queued ${requests.length} requests`);

for (const req of requests) {
    await requestQueue.addRequest(req);
}

const crawler = new PlaywrightCrawler({
    requestQueue,
    maxConcurrency,
    requestHandlerTimeoutSecs: requestTimeoutSecs,
    launchContext: {
        launchOptions: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
            ],
        },
    },
    browserPoolOptions: {
        useFingerprints: true, // Crawlee built-in fingerprint rotation
    },
    preNavigationHooks: [
        async ({ page }) => {
            // Mask automation signals
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'de-AT,de;q=0.9,en;q=0.8',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            });
            await page.addInitScript(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            });
        },
    ],

    async requestHandler({ request, page, log }) {
        const { shop, ean } = request.userData;
        log.info(`Scraping ${shop} for EAN ${ean} → ${request.url}`);

        const scraper = scrapers[shop];
        if (!scraper) {
            log.warning(`No scraper found for shop: ${shop}`);
            return;
        }

        try {
            await sleep(800 + Math.random() * 1200); // polite delay
            const result = await scraper(page, ean, request.url, log);

            if (result) {
                const record = {
                    ean,
                    shop,
                    productName: result.productName ?? null,
                    price: result.price ?? null,
                    currency: result.currency ?? 'EUR',
                    productUrl: result.productUrl ?? request.url,
                    inStock: result.inStock ?? null,
                    scrapedAt: new Date().toISOString(),
                };
                await dataset.pushData(record);
                log.info(`✅ ${shop} | EAN ${ean} | ${record.price} ${record.currency} | "${record.productName}"`);
            } else {
                log.warning(`⚠️  ${shop} | EAN ${ean} | Product not found`);
                await dataset.pushData({
                    ean,
                    shop,
                    productName: null,
                    price: null,
                    currency: null,
                    productUrl: request.url,
                    inStock: false,
                    error: 'Product not found',
                    scrapedAt: new Date().toISOString(),
                });
            }
        } catch (err) {
            log.error(`❌ ${shop} | EAN ${ean} | Error: ${err.message}`);
            await dataset.pushData({
                ean,
                shop,
                productName: null,
                price: null,
                currency: null,
                productUrl: request.url,
                inStock: null,
                error: err.message,
                scrapedAt: new Date().toISOString(),
            });
        }
    },

    failedRequestHandler({ request, log }) {
        const { shop, ean } = request.userData;
        log.error(`💥 Failed after retries: ${shop} | EAN ${ean}`);
    },
});

await crawler.run();

const { itemCount } = await dataset.getInfo();
console.log(`\n🏁 Done! ${itemCount} results saved to dataset.`);

await Actor.exit();
