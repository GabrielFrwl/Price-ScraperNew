const SHOP_SEARCH_URLS = {
    hornbach: (ean) => ({
        url: `https://www.hornbach.de/search/?searchTerm=${ean}`,
        label: 'search',
    }),
    globus: (ean) => ({
        url: `https://www.globus-baumarkt.de/suche/?q=${ean}`,
        label: 'search',
    }),
    amazon: (ean) => ({
        url: `https://www.amazon.de/s?k=${ean}`,
        label: 'search',
    }),
    obi: (ean) => ({
        url: `https://www.obi.de/suche/?q=${ean}`,
        label: 'search',
    }),
    bauhaus: (ean) => ({
        url: `https://www.bauhaus.de/de/search?q=${ean}`,
        label: 'search',
    }),
};

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
