import { expect, test } from '@playwright/test';
import { stubJwApi } from './stubs';

test.beforeEach(async ({ page }) => {
  await stubJwApi(page);
});

test('redirects / to the browser-language route', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/nl$/);
});

test('renders the page title and category cards from the API', async ({ page }) => {
  await page.goto('/nl');
  // Title from stubbed translations (hdgVideos)
  await expect(page.getByText("Video's")).toBeVisible();
  // A card from the stubbed LatestVideos category grid
  await expect(page.getByText('Video in LatestVideos').first()).toBeVisible();
});
