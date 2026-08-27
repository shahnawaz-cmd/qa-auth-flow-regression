import { Page } from '@playwright/test';
import { Actor } from '../actors/Actor';

/**
 * Automatically registers locator handlers with Playwright to dismiss popups
 * and cookie banners in the background whenever an action is blocked.
 */
export function registerAutoPopupHandlers(page: Page): void {
  try {
    if (typeof (page as any).addLocatorHandler !== 'function') return;

    // Cookie consent banner auto-handler
    const cookieConsentLocator = page.locator(
      '#cookie-consent-accept, .cookie-accept-btn, .cc-accept, #onetrust-accept-btn-handler, button:has-text("Accept All"), button:has-text("Allow All"), button:has-text("Accept Cookies"), button:has-text("I Agree")'
    );
    page.addLocatorHandler(cookieConsentLocator.first(), async (locator) => {
      console.log('🛡️ [Auto-Handler] Dismissing cookie consent banner...');
      await locator.click({ force: true }).catch(() => {});
    });

    // Exit intent & promotional modal close handler
    const modalCloseLocator = page.locator(
      '#exitIntentCloseBtn, .exit-intent-close-btn, button.exit-intent-secondary-btn, button[aria-label*="close" i], .modal-close, .popup-close, .close-modal-btn, button:has-text("✕"), button:has-text("×"), button:has-text("No Thanks"), button:has-text("Maybe Later")'
    );
    page.addLocatorHandler(modalCloseLocator.first(), async (locator) => {
      console.log('🛡️ [Auto-Handler] Dismissing promotional/exit-intent popup...');
      await locator.click({ force: true }).catch(() => {});
    });
  } catch (e) {
    // Ignore if addLocatorHandler is not supported or already registered
  }
}

/**
 * Smart Popup, Modal & Cookie Banner Dismissal Helper.
 * Checks visible-only elements and iframe overlays to dismiss popups,
 * GDPR cookies, live chat popups, or exit-intent dialogs without hanging.
 */
export async function dismissAllPopups(page: Page, customTimeout: number = 2000): Promise<boolean> {
  let dismissedAny = false;

  // 1. Hide LiveChat, Shepherd product tours, and blocking overlays via CSS injection
  try {
    await page.addStyleTag({
      content: '#chat-widget-container, #livechat-widget, [id*="chat"], [class*="livechat"], iframe[title*="chat" i], .shepherd-element, .shepherd-modal-overlay-container, .shepherd-content { display: none !important; pointer-events: none !important; visibility: hidden !important; }'
    }).catch(() => {});
  } catch (e) {}

  // 2. Comprehensive dismissal selectors for all monitored domains
  const dismissSelectors = [
    '.shepherd-cancel-icon',
    'button.shepherd-button',
    'button[aria-label*="Close Tour" i]',
    'button:has-text("Skip Tour")',
    'button:has-text("Done")',
    '#exitIntentCloseBtn',
    '.exit-intent-close-btn',
    'button.exit-intent-secondary-btn',
    'button[aria-label*="close" i]',
    'button[aria-label="close" i]',
    'button[aria-label="Close" i]',
    'button[title*="close" i]',
    'button:has-text("✕")',
    'button:has-text("×")',
    'button:has-text("Accept All")',
    'button:has-text("Allow All")',
    'button:has-text("Accept Cookies")',
    'button:has-text("Accept cookies")',
    'button:has-text("I Agree")',
    'button:has-text("I agree")',
    'button:has-text("Agree")',
    'button:has-text("No Thanks")',
    'button:has-text("No thanks")',
    'button:has-text("Maybe Later")',
    'button:has-text("Not now")',
    'button:has-text("Got it")',
    'button:has-text("Decline")',
    '#cookie-consent-accept',
    '.cookie-accept-btn',
    '.cc-accept',
    '#onetrust-accept-btn-handler',
    '.modal-close',
    '.popup-close',
    '.close-modal-btn',
    '[data-dismiss="modal"]',
    '[data-action="close"]',
    'div[class*="chat"] button[class*="close"]',
    'button[class*="chat-close"]'
  ];

  for (const sel of dismissSelectors) {
    try {
      const locator = page.locator(sel).locator('visible=true').first();
      const isVisible = await locator.isVisible({ timeout: customTimeout }).catch(() => false);
      if (isVisible) {
        console.log(`🛡️ [Smart Dismiss] External popup / Cookie banner detected ("${sel}"). Dismissing...`);
        await locator.scrollIntoViewIfNeeded().catch(() => {});
        await locator.click({ force: true }).catch(() => {});
        await locator.waitFor({ state: 'hidden', timeout: 1500 }).catch(() => {});
        console.log('✅ [Smart Dismiss] Popup dismissed successfully.');
        dismissedAny = true;
      }
    } catch (e) {
      // Gracefully continue to next selector
    }
  }

  // 3. Check embedded iframes for overlays and close buttons
  for (const frame of page.frames()) {
    try {
      const frameBtn = frame.locator(
        'button[aria-label*="close" i], button:has-text("Accept"), button:has-text("I Agree"), button:has-text("✕"), button:has-text("×")'
      ).locator('visible=true').first();
      if (await frameBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log('🛡️ [Smart Dismiss] Dismissing popup inside iframe overlay...');
        await frameBtn.click({ force: true }).catch(() => {});
        dismissedAny = true;
      }
    } catch (e) {}
  }

  return dismissedAny;
}

// Alias for compatibility with BrowseTheWeb
export const dismissPopupsAndCookies = dismissAllPopups;

/**
 * Screenplay Task for dismissing any visible popups, cookies, or modal overlays.
 */
export class DismissPopupTask {
  constructor(private customTimeout: number = 2000) {}

  static withTimeout(timeout: number = 2000): DismissPopupTask {
    return new DismissPopupTask(timeout);
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    await dismissAllPopups(page, this.customTimeout);
  }
}

export const DismissPopupsAndCookiesTask = DismissPopupTask;
export const DismissPopupsTask = DismissPopupTask;
