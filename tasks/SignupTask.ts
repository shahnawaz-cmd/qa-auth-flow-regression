import { Actor } from '../actors/Actor';
import { expect } from '@playwright/test';

export class SignupTask {
  constructor(private email: string, private password: string, private siteConfig: any, private phoneNumber?: string) {}

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name } = this.siteConfig;

    if (name === 'CD') {
      await page.getByRole('textbox', { name: 'Enter email address*' }).fill(this.email);
      if (this.phoneNumber) {
        await page.getByRole('textbox', { name: 'Enter phone number' }).fill(this.phoneNumber);
      }
      await page.locator('input[name="password"]').fill(this.password);
      await page.locator('input[name="confirmPassword"]').fill(this.password);
      await page.getByRole('checkbox').click();
      await page.getByRole('button', { name: 'Sign up' }).click();
    } else if (name === 'SCC') {
      await page.getByRole('textbox', { name: 'Email' }).fill(this.email);
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill(this.password);
      await page.getByRole('textbox', { name: 'Confirm Password' }).fill(this.password);
      await page.getByRole('button', { name: 'Submit' }).click();
    } else {
      // Default to DVH logic
      await page.getByRole('textbox', { name: 'Email Address' }).fill(this.email);
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill(this.password);
      await page.getByRole('textbox', { name: 'Confirm Password' }).fill(this.password);
      if (this.phoneNumber) {
        await page.getByRole('textbox', { name: 'Phone (Optional)' }).fill(this.phoneNumber);
      }
      await page.getByRole('button', { name: 'Create Account' }).click();
    }
  }

  async verifyDashboardRedirection(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name } = this.siteConfig;

    if (name === 'CD') {
      // Verify redirection for CD
      await page.waitForURL('**/search');
      await expect(page).toHaveURL(/.*\/search/);
    } else if (name === 'SCC') {
      // Verify redirection for SCC
      await page.waitForURL('**/dashboard?type=basic');
      await expect(page).toHaveURL(/.*\/dashboard\?type=basic/);
    } else {
      // Default to DVH and FORD logic: verify redirection to /dashboard
      await page.waitForURL('**/dashboard*');
      await expect(page).toHaveURL(/.*\/dashboard.*/);
    }
  }
}
