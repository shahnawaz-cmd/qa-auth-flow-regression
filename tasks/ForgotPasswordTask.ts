import { Actor } from '../actors/Actor';
import { TestInfo } from '@playwright/test';
import { clickWithHealing, locateInputWithHealing } from '../utils/selfHealingLocator';
import { dismissAllPopups } from './DismissPopupTask';

export class ForgotPasswordTask {
  constructor(
    private email: string,
    private siteConfig: any,
    private testInfo?: TestInfo,
    private isSlowNetwork: boolean = false
  ) {}

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name, forgotPasswordUrl, forgotApiEndpoint, timeout: configTimeout } = this.siteConfig;
    const timeout = this.isSlowNetwork ? 90000 : (configTimeout || 60000);

    console.log(`[ForgotPasswordTask] Testing forgot password flow on "${name}" (${this.email})...`);

    // Setup API capture with condition-based timeout
    let capturePromise: Promise<void> | undefined;
    if (forgotApiEndpoint) {
      capturePromise = page.waitForResponse(
        (response) => response.url().includes(forgotApiEndpoint) && response.request().method() === 'POST',
        { timeout }
      ).then(async (response) => {
        let responseBody: any = {};
        try {
          responseBody = await response.json();
        } catch (e) {
          responseBody = { text: await response.text().catch(() => '') };
        }
        const data = {
          url: response.url(),
          responseBody,
          status: response.status()
        };
        if (this.testInfo) {
          await this.testInfo.attach('forgot-password-api-response', {
            body: JSON.stringify(data, null, 2),
            contentType: 'application/json',
          });
        }
      }).catch(e => console.warn(`[ForgotPasswordTask] API capture warning (${name}):`, e.message));
    }

    await page.goto(forgotPasswordUrl, { waitUntil: 'domcontentloaded', timeout });

    // Dismiss any active external popups, cookie dialogs, or overlays
    await dismissAllPopups(page, 1500);

    // 1. Resilient Email Input with React Hydration Protection
    const emailFallbacks = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'textbox[name="Enter your email address"]'
    ];

    const emailInput = await locateInputWithHealing(
      page,
      'email',
      emailFallbacks,
      { isSlowNetwork: this.isSlowNetwork, timeout }
    );

    await emailInput.waitFor({ state: 'visible', timeout });
    await emailInput.click();
    await emailInput.fill(this.email);
    await emailInput.dispatchEvent('input').catch(() => {});
    await emailInput.dispatchEvent('change').catch(() => {});

    // React hydration reset protection on Forgot Password page
    await page.waitForTimeout(500);
    const currentEmailVal = await emailInput.inputValue().catch(() => '');
    if (currentEmailVal !== this.email) {
      console.log(`[Self-Healing] React hydration reset detected on ${name} forgot password. Re-filling Email...`);
      await emailInput.click();
      await emailInput.fill(this.email);
      await emailInput.dispatchEvent('input').catch(() => {});
      await emailInput.dispatchEvent('change').catch(() => {});
    }

    // Dismiss any overlay again before submit
    await dismissAllPopups(page, 500);

    // 2. Resilient Submit / Reset Password Button
    const submitFallbacks = [
      'button[type="submit"]',
      'button:has-text("Reset Password")',
      'button:has-text("Reset password")',
      'button:has-text("Send Reset Link")'
    ];

    await clickWithHealing(
      page,
      'Reset Password',
      submitFallbacks,
      { isSlowNetwork: this.isSlowNetwork, strategyTimeout: timeout }
    );

    if (capturePromise) {
      await capturePromise.catch(() => {});
    }

    console.log(`✅ [ForgotPasswordTask] Completed reset request for ${name}`);
  }
}
