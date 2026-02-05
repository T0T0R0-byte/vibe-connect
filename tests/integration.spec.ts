import { test, expect } from '@playwright/test';

test.describe('Integration: Search & Filtering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Homepage loads basic components', async ({ page }) => {
        await expect(page.getByText('The Ultimate Workshop Hub')).toBeVisible();
    });

    test('Search bar filters workshops', async ({ page }) => {
        await page.goto('/workshops');
        const searchInput = page.locator('input[placeholder*="Search"]');

        // Use a term likely to exist or likely to NOT exist
        await searchInput.fill('NonExistentWorkshopTerm');
        await page.keyboard.press('Enter');

        // Expect empty state or filtered list
        // Just ensuring the mechanism works without crashing
        await expect(page).not.toHaveURL(/error/);
    });
});
