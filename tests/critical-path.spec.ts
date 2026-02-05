import { test, expect } from '@playwright/test';
import path from 'path';

const TIMESTAMP = Date.now();
const VENDOR_EMAIL = `vendor_${TIMESTAMP}@playwright.test`;
const USER_EMAIL = `user_${TIMESTAMP}@playwright.test`;
const PASSWORD = 'TestPassword123!';
const WORKSHOP_TITLE = `E2E Workshop ${TIMESTAMP}`;

test.describe.serial('Full Application Lifecycle', () => {

    // --- VENDOR FLOW ---
    test.skip('1. Vendor Registration & Setup', async ({ page }) => {
        await page.goto('/register?role=vendor');

        // Fill Registration
        await page.fill('input[placeholder="John Doe"]', `Vendor ${TIMESTAMP}`);
        await page.fill('input[type="email"]', VENDOR_EMAIL);
        await page.fill('input[type="password"]', PASSWORD);

        // Vendor Specific Fields (since we are in vendor mode)
        await page.fill('input[placeholder="+94 77..."]', '+94 77 123 4567');
        await page.fill('input[placeholder="Instagram / Website Link"]', 'https://example.com');
        await page.setInputFiles('input[type="file"]', path.join(__dirname, 'assets/test_doc.pdf'));

        // Click Register
        await page.click('button:has-text("Initialize Identity")');

        // Should redirect to Vendor Dashboard
        // Wait for URL or a specific element on dashboard
        await expect(page).toHaveURL(/\/vendor/, { timeout: 30000 });
        // Vendor dashboard usually starts with "Welcome back" or similar
        await expect(page.locator('h1', { hasText: 'Welcome' })).toBeVisible({ timeout: 30000 });
    });

    test('2. Vendor Create Workshop', async ({ page }) => {
        // Login as Vendor (Session might not persist across tests unless configured, so re-login)
        await page.goto('/login');
        await page.fill('input[type="email"]', VENDOR_EMAIL);
        await page.fill('input[type="password"]', PASSWORD);
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/\/vendor/);

        // Create Workshop
        await page.click('button:has-text("New Vibe")'); // The "Create Vibe" tile

        await page.fill('input[placeholder*="Neon Photography"]', WORKSHOP_TITLE);
        await page.selectOption('select', 'Art');
        await page.fill('textarea[placeholder*="Brief overview"]', 'This is an automated test workshop.');
        await page.fill('textarea[placeholder*="Explain exactly"]', 'Full details for the automated test workshop.'); // Testing our new field

        // Fill Date (Future date)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const dateStr = futureDate.toISOString().split('T')[0];
        await page.fill('input[type="date"]', dateStr);

        await page.fill('input[placeholder="Max Participants"]', '10');
        await page.fill('input[placeholder*="City"]', 'Test City');
        // Refund Limit
        await page.locator('input[type="date"]').nth(1).fill(dateStr);

        // Upload Image - We need to be careful with file inputs
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(path.join(__dirname, 'assets/test_image.jpg'));

        // Submit
        await page.click('button:has-text("Launch Vibe")');

        // Verify it appears in the list
        await expect(page.getByText(WORKSHOP_TITLE)).toBeVisible();
    });

    test('3. Vendor Edit Workshop', async ({ page }) => {
        // Re-Login
        await page.goto('/login');
        await page.fill('input[type="email"]', VENDOR_EMAIL);
        await page.fill('input[type="password"]', PASSWORD);
        await page.click('button:has-text("Sign In")');

        // Find workshop and edit
        // The edit button might be tricky to click if it's hidden or absolute. 
        // We look for the card with our title.
        const card = page.locator('.glass-card', { hasText: WORKSHOP_TITLE });
        // Hover to reveal edit button if necessary, or just force click
        await card.hover();
        await card.locator('.fa-pen').click();

        // Change title
        const newTitle = `${WORKSHOP_TITLE} (Edited)`;
        await page.fill('input[placeholder*="Neon Photography"]', newTitle);
        await page.click('button:has-text("Save Changes")');

        await expect(page.getByText(newTitle)).toBeVisible();
    });

    // --- USER FLOW ---
    test('4. User Registration & Discovery', async ({ page }) => {
        await page.goto('/register');

        await page.fill('input[placeholder="John Doe"]', `User ${TIMESTAMP}`);
        await page.fill('input[type="email"]', USER_EMAIL);
        await page.fill('input[type="password"]', PASSWORD);
        await page.click('button:has-text("Initialize Identity")'); // Updated

        // Should go to home or onboarding
        await expect(page).toHaveURL('/');

        // Go to Workshops page
        await page.click('text=Find Workshop'); // Navbar or Hero button

        // Filter (Search)
        await page.fill('input[placeholder*="Search"]', 'Art');
        await page.keyboard.press('Enter');

        // Verify we see workshops (at least generic ones)
        await expect(page.getByText('Art')).first().toBeVisible();
    });

    test('5. User Logout', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[type="email"]', USER_EMAIL);
        await page.fill('input[type="password"]', PASSWORD);
        await page.click('button:has-text("Sign In")');

        // Logout
        await page.locator('.fa-arrow-right-from-bracket').click(); // Icon in navbar
        await expect(page).toHaveURL('/login');
    });

});
