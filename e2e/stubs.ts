import type { Page, Route } from '@playwright/test';
import { LANGUAGES, makeCategory, makeVideo, SEARCH, TRANSLATIONS } from './fixtures';

// Cross-origin fetches (localhost → b.jw-cdn.org) need CORS headers, or the
// browser blocks the stubbed response and every API call rejects.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type',
};

function json(route: Route, body: unknown) {
  return route.fulfill({ json: body, headers: CORS });
}

// Answer CORS preflight before the real handler runs
function preflight(route: Route): boolean {
  if (route.request().method() === 'OPTIONS') {
    route.fulfill({ status: 204, headers: CORS });
    return true;
  }
  return false;
}

/**
 * Intercept every jw.org / external request so the flows are deterministic and
 * offline. Responses are built by endpoint so the language code doesn't matter.
 */
export async function stubJwApi(page: Page) {
  // Block external SDK / analytics / fonts
  await page.route(/gstatic\.com\/cv\/js\/sender/, r => r.abort());
  await page.route(/googletagmanager\.com|google-analytics\.com|fonts\.(googleapis|gstatic|bunny)/, r => r.abort());

  await page.route(/\/mediator\/v1\/languages\//, r => json(r, { languages: LANGUAGES }));

  await page.route(/\/mediator\/v1\/translations\/([^/?]+)/, (r) => {
    const code = r.request().url().match(/translations\/([^/?]+)/)![1]!;
    return json(r, { translations: { [code]: TRANSLATIONS } });
  });

  await page.route(/\/mediator\/v1\/categories\/[^/]+\/([^/?]+)/, (r) => {
    const name = r.request().url().match(/categories\/[^/]+\/([^/?]+)/)![1]!;
    return json(r, makeCategory(name, [makeVideo('pub-test_1_VIDEO', `Video in ${name}`)]));
  });

  await page.route(/\/mediator\/v1\/media-items\/[^/]+\/([^/?]+)/, (r) => {
    const lank = r.request().url().match(/media-items\/[^/]+\/([^/?]+)/)![1]!;
    return json(r, { media: [makeVideo(lank, `Opened ${lank}`)] });
  });

  await page.route(/\/tokens\/jworg\.jwt/, r =>
    r.fulfill({ body: 'jwt-token', contentType: 'text/plain', headers: CORS }));

  await page.route(/\/apis\/search\/results\//, (r) => {
    if (preflight(r)) {
      return;
    }
    return json(r, SEARCH);
  });
}
