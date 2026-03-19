/**
 * Parses a raw price string like "€ 12,99", "12.99 €", "12,99€" → 12.99
 * @param {string} raw
 * @returns {number|null}
 */
export function parsePrice(raw) {
    if (!raw) return null;
    // Remove currency symbols, whitespace, non-breaking spaces
    const cleaned = raw
        .replace(/[€$£\s\u00a0]/g, '')
        .replace(/\.(?=\d{3})/g, '')  // remove thousands separator dots
        .replace(',', '.');            // normalize decimal comma to dot
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

/**
 * Waits for a selector to appear, returns null if it times out instead of throwing.
 * @param {import('playwright').Page} page
 * @param {string} selector
 * @param {number} timeout
 */
export async function safeWaitForSelector(page, selector, timeout = 5000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch {
        return false;
    }
}
