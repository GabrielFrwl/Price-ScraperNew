import { parsePrice, safeWaitForSelector } from '../utils/priceParser.js';

/**
 * Bauhaus Austria scraper
 */
export async function scrapeBauhaus(page, ean, searchUrl, log) {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Accept cookies
    const cookieBtn = page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll, button[id*="accept"]').first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cookieBtn.click();
        await page.waitForTimeout(800);
    }

    // Check if we're redirected directly to a product page (exact EAN match)
    const isProductPage = await safeWaitForSelector(page, '[class*="product-detail"], .pdp-price, [class*="ProductDetail"]', 4000);

    if (isProductPage) {
        // Already on product page
        const priceRaw = await page
            .locator('[class*="price__value"], [class*="selling-price"], .pdp-price')
            .first()
            .textContent()
            .catch(() => null);
        const productName = await page.locator('h1').first().textContent().catch(() => null);

        return {
            productName: productName?.trim() ?? null,
            price: parsePrice(priceRaw),
            currency: 'EUR',
            productUrl: page.url(),
            inStock: priceRaw !== null,
        };
    }

    // Otherwise handle search results page
    const found = await safeWaitForSelector(page, '[class*="product-tile"], [class*="ProductTile"], .product-item', 8000);

    if (!found) {
        log.warning(`Bauhaus: No results for EAN ${ean}`);
        return null;
    }

    const productLink = page
        .locator('[class*="product-tile"] a, [class*="ProductTile"] a, .product-item a')
        .first();
    const href = await productLink.getAttribute('href').catch(() => null);
    const fullProductUrl = href ? new URL(href, 'https://www.bauhaus.at').href : searchUrl;

    await page.goto(fullProductUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    await safeWaitForSelector(page, '[class*="price__value"], [class*="selling-price"]', 6000);

    const priceRaw = await page
        .locator('[class*="price__value"], [class*="selling-price"]')
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
