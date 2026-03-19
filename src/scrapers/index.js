import { scrapeHornbach } from './hornbach.js';
import { scrapeObi } from './obi.js';
import { scrapeBauhaus } from './bauhaus.js';
import { scrapeGlobus } from './globus.js';
import { scrapeAmazon } from './amazon.js';

export const scrapers = {
    hornbach: scrapeHornbach,
    obi: scrapeObi,
    bauhaus: scrapeBauhaus,
    globus: scrapeGlobus,
    amazon: scrapeAmazon,
};
