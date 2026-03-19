import { parsePrice, safeWaitForSelector } from '../utils/priceParser.js';

/**
 * OBI Austria scraper
 */
export async function scrapeObi(page, ean, searchUrl, log) {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Accept cookies
    const cookieBtn = page.locator('#onetrust-accept-btn-handler, button[aria-label*="Alle akzeptieren"]').first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBtn.click();
        await page.waitForTimeout(800);
    }

    // Wait for search results
    const found = await safeWaitForSelector(
        page,
        '[data-testid="product-card"], .ProductCard, .product-list-item, article[class*="product"]',
        8000
    );

    if (!found) {
        log.warning(`OBI: No results for EAN ${ean}`);
        return null;
    }

    // Get product URL
    const productLink = page.locator('[data-testid="product-card"] a, .ProductCard a, .product-list-item a').first();
    const href = await productLink.getAttribute('href').catch(() => null);
    const fullProductUrl = href ? new URL(href, 'https://www.obi.at').href : searchUrl;

    await page.goto(fullProductUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    await safeWaitForSelector(page, '[data-testid="product-price"], [class*="Price"], .price', 6000);

    const priceRaw = await page
        .locator('[data-testid="product-price"], [class*="PriceTag"], [class*="price--selling"]')
        .first()
        .textContent()
        .catch(() => null);

    const productName = await page.locator('h1').first().textContent().catch(() => null);

    return {
        productName: productName?.trim() ?? null,
        price: parsePrice(priceRaw),
        currency: 'EUR',
        productUrl: fullProductUrl,
        inStock: priceRaw !== null,
    };
}
