import { test, expect } from '@playwright/test';

test('homepage has title and links', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/VibeConnect/);

    // Check for the main CTA button
    const exploreBtn = page.getByRole('link', { name: /Explore Experiences/i });
    await expect(exploreBtn).toBeVisible();
});

test('login page loads', async ({ page }) => {
    await page.goto('/login');

    // Check for login heading or email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
});
