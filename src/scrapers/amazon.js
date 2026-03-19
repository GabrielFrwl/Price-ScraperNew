import { parsePrice, safeWaitForSelector } from '../utils/priceParser.js';

/**
 * Amazon.de scraper – EAN search → first result → price
 * Amazon is strict about scraping; Apify proxy with residential IPs is recommended.
 */
export async function scrapeAmazon(page, ean, searchUrl, log) {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });

    // Handle CAPTCHA / bot detection
    const isCaptcha = await page.locator('form[action="/errors/validateCaptcha"]').isVisible().catch(() => false);
    if (isCaptcha) {
        log.warning(`Amazon: CAPTCHA detected for EAN ${ean}. Consider using residential proxies.`);
        return null;
    }

    // Wait for search results
    const found = await safeWaitForSelector(
        page,
        '[data-component-type="s-search-result"], [data-asin]',
        10000
    );

    if (!found) {
        log.warning(`Amazon: No results for EAN ${ean}`);
        return null;
    }

    // Get first sponsored-free result (skip ads)
    const organicResult = page
        .locator('[data-component-type="s-search-result"]:not([data-component-type="s-sponsored-result"])')
        .first();

    const asin = await organicResult.getAttribute('data-asin').catch(() => null);
    if (!asin) return null;

    const fullProductUrl = `https://www.amazon.de/dp/${asin}?th=1&psc=1`;
    await page.goto(fullProductUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });

    await safeWaitForSelector(page, '#priceblock_ourprice, .a-price .a-offscreen, #corePriceDisplay_desktop_feature_div', 8000);

    // Try multiple Amazon price selectors (layout changes often)
    const priceSelectors = [
        '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price .a-offscreen',
        '#price_inside_buybox',
    ];

    let priceRaw = null;
    for (const sel of priceSelectors) {
        priceRaw = await page.locator(sel).first().textContent().catch(() => null);
        if (priceRaw) break;
    }

    const productName = await page.locator('#productTitle').textContent().catch(() => null);

    // Check out-of-stock
    const outOfStock = await page.locator('#outOfStock, #availability .a-color-error').isVisible().catch(() => false);

    return {
        productName: productName?.trim() ?? null,
        price: parsePrice(priceRaw),
        currency: 'EUR',
        productUrl: fullProductUrl,
        inStock: !outOfStock && priceRaw !== null,
    };
}
