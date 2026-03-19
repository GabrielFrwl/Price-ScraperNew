import { parsePrice, safeWaitForSelector } from '../utils/priceParser.js';

/**
 * Hornbach Austria scraper
 * Search → click first result → extract price
 */
export async function scrapeHornbach(page, ean, searchUrl, log) {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Accept cookies if shown
    const cookieBtn = page.locator('button[data-testid="cookie-accept-all"], #onetrust-accept-btn-handler').first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBtn.click();
        await page.waitForTimeout(800);
    }

    // Check for product results
    const firstProduct = page.locator('[data-testid="product-tile"], .product-tile, article.product').first();
    const found = await safeWaitForSelector(page, '[data-testid="product-tile"], .product-tile, article.product', 8000);

    if (!found) {
        log.warning(`Hornbach: No results for EAN ${ean}`);
        return null;
    }

    // Click into first product
    const productLink = page.locator('[data-testid="product-tile"] a, .product-tile a').first();
    const productUrl = await productLink.getAttribute('href').catch(() => null);
    const fullProductUrl = productUrl ? new URL(productUrl, 'https://www.hornbach.at').href : searchUrl;

    await page.goto(fullProductUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Extract price
    await safeWaitForSelector(page, '[data-testid="product-price"], .price__value, [class*="price"]', 6000);

    const priceRaw = await page.locator('[data-testid="product-price"] [data-testid="price-value"], .price__value, [class*="price__selling"]')
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
