import { test, expect } from '@playwright/test';

test.describe('Security & Access Control', () => {

    test('Guest cannot access Vendor Dashboard', async ({ page }) => {
        await page.goto('/vendor');
        // Should be redirected to login or show error (or 404/home)
        // Based on middleware/context logic, usually redirects to login or home
        await expect(page).toHaveURL(/login|register/);
    });

    test('Guest cannot access Admin Dashboard', async ({ page }) => {
        await page.goto('/admin');
        await expect(page).toHaveURL(/login|register/);
    });

    test('Guest cannot access Profile', async ({ page }) => {
        await page.goto('/profile');
        await expect(page).toHaveURL(/login|register/);
    });

});
