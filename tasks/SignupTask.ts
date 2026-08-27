import { Actor } from '../actors/Actor';
import { expect } from '@playwright/test';
import { clickWithHealing, locateInputWithHealing } from '../utils/selfHealingLocator';
import { dismissAllPopups } from './DismissPopupTask';
import { acceptTermsCheckbox } from './AcceptTermsTask';

export class SignupTask {
  constructor(
    private email: string,
    private password: string,
    private siteConfig: any,
    private phoneNumber?: string,
    private isSlowNetwork: boolean = false
  ) {}

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name, selectors } = this.siteConfig;
    const timeout = this.isSlowNetwork ? 90000 : 45000;

    console.log(`[SignupTask] Starting registration for site "${name}" (Email: ${this.email})...`);

    // Dismiss any active external popups, cookie dialogs, or overlays
    await dismissAllPopups(page, 1500);

    // 1. Resilient Email Input
    const emailFallbacks = [
      ...(selectors?.email ? [selectors.email] : []),
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'textbox[name="Enter email address*"]'
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

    // 2. Resilient Password Input
    const passwordFallbacks = [
      ...(selectors?.password ? [selectors.password] : []),
      'input[name="password"]',
      'input[type="password"]:not([placeholder*="confirm" i]):not([name*="confirm" i])'
    ];

    const passwordInput = await locateInputWithHealing(
      page,
      'password',
      passwordFallbacks,
      { isSlowNetwork: this.isSlowNetwork, timeout }
    );

    await passwordInput.waitFor({ state: 'visible', timeout });
    await passwordInput.click();
    await passwordInput.fill(this.password);
    await passwordInput.dispatchEvent('input').catch(() => {});
    await passwordInput.dispatchEvent('change').catch(() => {});

    // 3. Resilient Confirm Password Input (if present on the form)
    const confirmPasswordFallbacks = [
      ...(selectors?.confirmPassword ? [selectors.confirmPassword] : []),
      'input[name="confirmPassword"]',
      'input[name*="confirm" i]',
      'input[placeholder*="confirm" i]',
      (p: any) => p.locator('input[type="password"]').nth(1)
    ];

    try {
      const confirmInput = await locateInputWithHealing(
        page,
        'confirm',
        confirmPasswordFallbacks,
        { isSlowNetwork: this.isSlowNetwork, timeout: 3000, strategyTimeout: 1500 }
      );
      if (await confirmInput.isVisible({ timeout: 1500 })) {
        await confirmInput.fill(this.password);
        await confirmInput.dispatchEvent('input').catch(() => {});
        await confirmInput.dispatchEvent('change').catch(() => {});
      }
    } catch (e) {}

    // 4. Phone Number Input (if provided / supported)
    if (this.phoneNumber) {
      const phoneFallbacks = [
        ...(selectors?.phone ? [selectors.phone] : []),
        'input[name="phone"]',
        'input[type="tel"]',
        'input[placeholder*="phone" i]'
      ];

      try {
        const phoneInput = await locateInputWithHealing(
          page,
          'phone',
          phoneFallbacks,
          { isSlowNetwork: this.isSlowNetwork, timeout: 3000, strategyTimeout: 1500 }
        );
        if (await phoneInput.isVisible({ timeout: 1500 })) {
          await phoneInput.fill(this.phoneNumber);
          await phoneInput.dispatchEvent('input').catch(() => {});
          await phoneInput.dispatchEvent('change').catch(() => {});
        }
      } catch (e) {}
    }

    // 5. Adaptive Terms & Conditions Checkbox (if present)
    await acceptTermsCheckbox(page, 3000);

    // 🛡️ Pre-Submit Hydration Protection: Verify inputs didn't get cleared by React
    await page.waitForTimeout(500);
    const finalEmailVal = await emailInput.inputValue().catch(() => '');
    if (!finalEmailVal || finalEmailVal !== this.email) {
      console.log(`[Self-Healing] React hydration reset detected on ${name} before submit. Re-filling Email...`);
      await emailInput.click();
      await emailInput.fill(this.email);
      await emailInput.dispatchEvent('input').catch(() => {});
      await emailInput.dispatchEvent('change').catch(() => {});
    }

    const finalPassVal = await passwordInput.inputValue().catch(() => '');
    if (!finalPassVal || finalPassVal !== this.password) {
      console.log(`[Self-Healing] React hydration reset detected on ${name} before submit. Re-filling Password...`);
      await passwordInput.click();
      await passwordInput.fill(this.password);
      await passwordInput.dispatchEvent('input').catch(() => {});
      await passwordInput.dispatchEvent('change').catch(() => {});
    }

    // 6. Resilient Submit Button
    const submitFallbacks = [
      ...(selectors?.submit ? [selectors.submit] : []),
      'button[type="submit"]',
      'button:has-text("Create Account")',
      'button:has-text("Sign up")',
      'button:has-text("Submit")'
    ];

    await clickWithHealing(
      page,
      'Create Account',
      submitFallbacks,
      { isSlowNetwork: this.isSlowNetwork, strategyTimeout: 5000 }
    );
  }

  async verifyDashboardRedirection(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name } = this.siteConfig;
    const timeout = this.isSlowNetwork ? 90000 : 60000;

    console.log(`[SignupTask] Verifying dashboard redirection for "${name}"...`);

    if (name === 'CD') {
      try {
        await page.waitForURL(/.*(\/search|\/auth\/search|\/dashboard).*/i, { timeout });
        await expect(page).toHaveURL(/.*(\/search|\/auth\/search|\/dashboard).*/i);
      } catch (err: any) {
        console.warn(`[CD URL warning] Current URL: ${page.url()} - Error: ${err.message}`);
        await expect(page).toHaveURL(/.*(\/search|\/auth\/search|\/dashboard).*/i);
      }
    } else if (name === 'SCC') {
      try {
        await page.waitForURL(/.*(\/dashboard\?type=basic|\/members\/dashboard|\/dashboard).*/i, { timeout });
        await expect(page).toHaveURL(/.*(\/dashboard\?type=basic|\/members\/dashboard|\/dashboard).*/i);
      } catch (err: any) {
        console.warn(`[SCC URL warning] Current URL: ${page.url()} - Error: ${err.message}`);
        await expect(page).toHaveURL(/.*(\/dashboard\?type=basic|\/members\/dashboard|\/dashboard).*/i);
      }
    } else {
      try {
        await page.waitForURL(/.*(\/dashboard|\/members\/dashboard|\/search|\/home).*/i, { timeout });
        await expect(page).toHaveURL(/.*(\/dashboard|\/members\/dashboard|\/search|\/home).*/i);
      } catch (err: any) {
        console.warn(`[${name} URL warning] Current URL: ${page.url()} - Error: ${err.message}`);
        await expect(page).toHaveURL(/.*(\/dashboard|\/members\/dashboard|\/search|\/home).*/i);
      }
    }

    console.log(`✅ [SignupTask] Dashboard verified for ${name} at URL: ${page.url()}`);
  }
}