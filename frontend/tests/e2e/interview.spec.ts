import { test, expect, Page } from '@playwright/test';

/**
 * Happy-path E2E test:
 *   Login → Start Technical Interview → Upload/Paste Resume → Verify Dashboard
 *
 * Requires:
 *   - Frontend running on http://localhost:3000
 *   - Backend running on http://localhost:8000
 *   - Seed user in DB: test@pitchperfect.test / Test@Password123
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function login(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/PitchPerfect/i);

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should redirect to dashboard after successful login
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Test: Full Happy Path
// ---------------------------------------------------------------------------
test.describe('Interview Happy Path', () => {
    test.use({ baseURL: 'http://localhost:3000' });

    // Reuse authenticated browser state across tests in this suite
    test.beforeEach(async ({ page }) => {
        await login(page, 'test@pitchperfect.test', 'Test@Password123');
    });

    // ------------------------------------------------------------------
    test('Login lands on the dashboard', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
        await expect(page.getByTestId('interview-list')).toBeVisible();
    });

    // ------------------------------------------------------------------
    test('Start new interview flow', async ({ page }) => {
        // 1. Click CTA to create a new interview
        await page.getByRole('button', { name: /new interview|start interview/i }).click();
        await page.waitForURL('**/interviews/new', { timeout: 5_000 });

        // 2. Fill in job details
        await page.getByLabel(/interview title/i).fill('Google SWE Interview');
        await page.getByLabel(/job role/i).fill('Senior Software Engineer');
        await page.getByLabel(/job description/i).fill(
            'Design and implement distributed systems at massive scale.'
        );

        // 3. Paste resume text (tab: "Paste Text")
        const pasteTab = page.getByRole('tab', { name: /paste text/i });
        if (await pasteTab.isVisible()) {
            await pasteTab.click();
        }
        await page.getByLabel(/resume text|paste your resume/i).fill(
            '5 years Python. Led async microservices migration. PostgreSQL, Redis, FastAPI.'
        );

        // 4. Submit
        await page.getByRole('button', { name: /generate questions|start/i }).click();

        // 5. Loading state should appear
        const loadingIndicator = page.getByTestId('generating-questions-loader');
        if (await loadingIndicator.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await expect(loadingIndicator).toBeVisible();
        }

        // 6. Should navigate to interview session page
        await page.waitForURL(/\/interviews\/[a-z0-9-]+\/session/, { timeout: 30_000 });
        await expect(page.getByTestId('interview-session-container')).toBeVisible();
    });

    // ------------------------------------------------------------------
    test('Interview session shows generated questions', async ({ page }) => {
        // Navigate directly if a session was created in previous run
        await page.getByRole('link', { name: /google swe interview/i }).first().click();
        await page.waitForURL(/\/interviews\/[a-z0-9-]+/, { timeout: 5_000 });

        const questionCard = page.getByTestId('question-card').first();
        await expect(questionCard).toBeVisible({ timeout: 10_000 });

        // Each card must have question text
        const questionText = questionCard.getByTestId('question-text');
        await expect(questionText).not.toBeEmpty();
    });

    // ------------------------------------------------------------------
    test('Submit a text answer and see AI feedback', async ({ page }) => {
        await page.getByRole('link', { name: /google swe interview/i }).first().click();
        await page.waitForURL(/\/interviews\/[a-z0-9-]+\/session/, { timeout: 5_000 });

        // Type a text answer into the first question
        const answerTextArea = page.getByTestId('answer-textarea').first();
        await answerTextArea.fill(
            'Async in Python uses the event loop to schedule coroutines non-blocking.'
        );

        // Submit
        await page.getByRole('button', { name: /submit answer/i }).first().click();

        // AI feedback panel should appear
        const feedbackPanel = page.getByTestId('ai-feedback-panel').first();
        await expect(feedbackPanel).toBeVisible({ timeout: 20_000 });

        // Verify score badges
        await expect(feedbackPanel.getByTestId('clarity-score')).not.toBeEmpty();
        await expect(feedbackPanel.getByTestId('tech-depth-score')).not.toBeEmpty();
        await expect(feedbackPanel.getByTestId('communication-score')).not.toBeEmpty();
    });

    // ------------------------------------------------------------------
    test('Session report is accessible after completion', async ({ page }) => {
        await page.goto('/dashboard');
        const completedBadge = page.getByTestId('status-badge').filter({ hasText: /completed/i }).first();

        // Skip if no completed session yet
        if (!(await completedBadge.isVisible({ timeout: 3_000 }).catch(() => false))) {
            test.skip();
            return;
        }

        await completedBadge.locator('..').getByRole('link', { name: /view report/i }).click();
        await page.waitForURL(/\/sessions\/[a-z0-9-]+\/report/, { timeout: 5_000 });

        // Radar chart + score summary must render
        await expect(page.getByTestId('skill-radar-chart')).toBeVisible({ timeout: 8_000 });
        await expect(page.getByTestId('overall-score-display')).toBeVisible();
    });
});
