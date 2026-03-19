import { parsePrice, safeWaitForSelector } from '../utils/priceParser.js';

/**
 * Globus Baumarkt scraper
 */
export async function scrapeGlobus(page, ean, searchUrl, log) {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Accept cookies
    const cookieBtn = page.locator('button[data-testid*="accept"], #accept-all-cookies, .accept-cookies').first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBtn.click();
        await page.waitForTimeout(800);
    }

    // Wait for results
    const found = await safeWaitForSelector(
        page,
        '[class*="product-card"], [class*="ProductCard"], [class*="product-item"], .search-result-item',
        8000
    );

    if (!found) {
        log.warning(`Globus: No results for EAN ${ean}`);
        return null;
    }

    const productLink = page
        .locator('[class*="product-card"] a, [class*="ProductCard"] a, .search-result-item a')
        .first();
    const href = await productLink.getAttribute('href').catch(() => null);
    const fullProductUrl = href ? new URL(href, 'https://www.globus-baumarkt.de').href : searchUrl;

    await page.goto(fullProductUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    await safeWaitForSelector(page, '[class*="price"], .product-price', 6000);

    const priceRaw = await page
        .locator('[class*="selling-price"], [class*="price__main"], .product-price')
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
