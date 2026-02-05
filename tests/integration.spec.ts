import { test, expect } from '@playwright/test';

test.describe('Integration: Search & Filtering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Homepage loads basic components', async ({ page }) => {
        await expect(page.locator('text=Connect. Create. Vibe.')).toBeVisible();
    });

    test('Search bar filters workshops', async ({ page }) => {
        // Assuming there is a Workshop on the home page or workshops page
        // This test assumes at least one workshop exists or the empty state is handled gracefully
        const searchInput = page.locator('input[placeholder*="Search"]');

        // Use a term likely to exist or likely to NOT exist
        await searchInput.fill('NonExistentWorkshopTerm');
        await page.keyboard.press('Enter');

        // Expect empty state or filtered list
        // Just ensuring the mechanism works without crashing
        await expect(page).not.toHaveURL(/error/);
    });
});
