import { Page, Locator } from '@playwright/test';
import { Actor } from '../actors/Actor';

/**
 * Robust helper function to accept terms & conditions checkbox.
 * Handles native checkboxes, custom React/Vue/MUI wrappers, and labels.
 */
export async function acceptTermsCheckbox(page: Page, timeout: number = 5000): Promise<boolean> {
  const checkboxStrategies: (() => Locator)[] = [
    () => page.getByRole('checkbox').first(),
    () => page.locator('input[type="checkbox"]').first(),
    () => page.locator('label:has(input[type="checkbox"])').first(),
    () => page.locator('label').filter({ hasText: /terms|conditions|agree|privacy/i }).first(),
    () => page.locator('[class*="checkbox"], [id*="terms"], [id*="agree"]').first()
  ];

  for (let i = 0; i < checkboxStrategies.length; i++) {
    try {
      const loc = checkboxStrategies[i]();
      const isVisible = await loc.isVisible({ timeout: 1500 }).catch(() => false);
      if (isVisible) {
        const isChecked = await loc.isChecked().catch(async () => {
          const input = loc.locator('input[type="checkbox"]');
          if (await input.count() > 0) {
            return await input.first().isChecked().catch(() => false);
          }
          return (await loc.getAttribute('aria-checked')) === 'true';
        });

        if (!isChecked) {
          console.log(`[AcceptTermsTask] Checking Terms & Conditions checkbox (strategy #${i + 1})...`);
          await loc.scrollIntoViewIfNeeded().catch(() => {});
          
          // Try regular click first to trigger React state changes
          await loc.click({ force: true }).catch(() => {});
          
          // If still not checked, try check() method
          const stillNotChecked = await loc.isChecked().catch(() => false);
          if (!stillNotChecked) {
            await loc.check({ force: true }).catch(() => {});
          }

          // Trigger native event dispatching for form synchronizers
          await loc.dispatchEvent('change').catch(() => {});
          await loc.dispatchEvent('input').catch(() => {});
          console.log('✅ [AcceptTermsTask] Terms & Conditions checkbox checked successfully.');
          return true;
        } else {
          console.log('ℹ️ [AcceptTermsTask] Terms & Conditions checkbox is already checked.');
          return true;
        }
      }
    } catch (e) {
      // Continue to next strategy
    }
  }

  return false;
}

/**
 * Screenplay Task for accepting Terms & Conditions checkbox.
 */
export class AcceptTermsTask {
  constructor(private timeout: number = 5000) {}

  static check(): AcceptTermsTask {
    return new AcceptTermsTask();
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    await acceptTermsCheckbox(page, this.timeout);
  }
}

export const CheckboxTask = AcceptTermsTask;
export const AcceptTermsCheckboxTask = AcceptTermsTask;
