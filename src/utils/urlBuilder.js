/**
 * Builds search/product URLs for each EAN × shop combination.
 * Most Baumärkte support EAN search via their internal search.
 */

const SHOP_SEARCH_URLS = {
    hornbach: (ean) => ({
        url: `https://www.hornbach.at/search/?q=${ean}`,
        label: 'search',
    }),
    globus: (ean) => ({
        // Globus Baumarkt uses their own search
        url: `https://www.globus-baumarkt.de/suche/?q=${ean}`,
        label: 'search',
    }),
    amazon: (ean) => ({
        // Amazon supports direct EAN/GTIN search
        url: `https://www.amazon.de/s?k=${ean}`,
        label: 'search',
    }),
    obi: (ean) => ({
        url: `https://www.obi.at/suche/?q=${ean}`,
        label: 'search',
    }),
    bauhaus: (ean) => ({
        url: `https://www.bauhaus.at/suche?q=${ean}`,
        label: 'search',
    }),
};

/**
 * @param {string[]} eans
 * @param {string[]} shops
 * @returns {import('crawlee').Request[]}
 */
export function buildSearchUrls(eans, shops) {
    const requests = [];

    for (const ean of eans) {
        for (const shop of shops) {
            const builder = SHOP_SEARCH_URLS[shop.toLowerCase()];
            if (!builder) {
                console.warn(`Unknown shop: ${shop}`);
                continue;
            }
            const { url, label } = builder(ean);
            requests.push({
                url,
                label,
                userData: { shop: shop.toLowerCase(), ean },
                uniqueKey: `${shop}::${ean}`,
            });
        }
    }

    return requests;
}
