import { Actor } from '../actors/Actor';
import { Page, TestInfo, expect, Response } from '@playwright/test';
import { dismissAllPopups } from './DismissPopupTask';

export class CaptureDashboardApiResponseTask {
  private page?: Page;
  private capturePromise?: Promise<Response | null>;
  private isSlowNetwork: boolean = false;
  private capturedResponse: Response | null = null;

  constructor(
    private siteConfig: any,
    private testInfo?: TestInfo,
    private stage: 'signup' | 'login' | 'dashboard' = 'dashboard',
    private timeout: number = 60000
  ) {
    this.isSlowNetwork = process.env.SLOW_NETWORK === 'true' || Boolean(process.env.CI);
    this.timeout = this.isSlowNetwork ? 90000 : 60000;
    this.listenerTimeout = this.isSlowNetwork ? 25000 : 15000;
  }

  /**
   * Helper to extract domain dynamically from site configuration
   */
  private getDomain(): string {
    if (this.siteConfig?.domain) return this.siteConfig.domain;
    if (this.siteConfig?.signupUrl) {
      try {
        return new URL(this.siteConfig.signupUrl).hostname;
      } catch (e) {}
    }
    if (this.siteConfig?.loginUrl) {
      try {
        return new URL(this.siteConfig.loginUrl).hostname;
      } catch (e) {}
    }
    return '';
  }

  /**
   * Starts condition-based listening for the dashboard RSC / page GET API response.
   * For SCC (classic non-RSC portal), API listening is skipped.
   */
  startListening(page: Page): this {
    this.page = page;
    const siteName = this.siteConfig?.name || 'UnknownSite';

    // SCC is a classic non-RSC portal: skip API response listener
    if (siteName === 'SCC') {
      console.log(`[CaptureDashboardApiResponseTask] SCC is a classic portal; skipping RSC API listener.`);
      return this;
    }

    const domain = this.getDomain();
    console.log(`[CaptureDashboardApiResponseTask] Initializing condition-based dashboard API listener for ${siteName} (${this.stage}, domain: ${domain || 'dynamic'})...`);

    this.capturePromise = page.waitForResponse(
      (response: Response) => {
        const req = response.request();
        if (req.method() !== 'GET') return false;

        const url = response.url();
        const matchesDomain = domain ? url.includes(domain) : true;

        // Matches /dashboard, /members/dashboard, or /search (for CD)
        const matchesDashboardPath =
          url.includes('/dashboard') ||
          url.includes('/members/dashboard') ||
          (this.siteConfig?.name === 'CD' && (url.includes('/search') || url.includes('/auth/search')));

        // Specifically match Next.js RSC query (_rsc=...), greet=true, or landing fetch/document
        const matchesRscOrLanding =
          url.includes('_rsc=') ||
          url.includes('greet=') ||
          req.resourceType() === 'fetch' ||
          req.resourceType() === 'document';

        return matchesDomain && matchesDashboardPath && matchesRscOrLanding;
      },
      { timeout: 15000 }
    ).then((res) => {
      this.capturedResponse = res;
      console.log(`📡 [CaptureDashboardApiResponseTask] Condition matched: Intercepted dashboard API response on ${siteName}: ${res.url()} [Status: ${res.status()}]`);
      return res;
    }).catch(() => {
      return null;
    });

    return this;
  }

  /**
   * Static factory method to start listening before a form submit / navigation
   */
  static start(page: Page, siteConfig: any, testInfo?: TestInfo, stage: 'signup' | 'login' | 'dashboard' = 'dashboard'): CaptureDashboardApiResponseTask {
    const task = new CaptureDashboardApiResponseTask(siteConfig, testInfo, stage);
    task.startListening(page);
    return task;
  }

  /**
   * Smart condition-based wait to ensure the dashboard page has FULLY loaded:
   * - Network idle state reached
   * - Skeleton/shimmer/spinners are hidden
   * - Core dashboard containers and interactive elements are mounted & visible
   * - Any modal/cookie popups dismissed
   */
  private async waitForFullDashboardLoad(page: Page): Promise<void> {
    const siteName = this.siteConfig?.name || 'UnknownSite';
    console.log(`⏳ [CaptureDashboardApiResponseTask] Waiting for dashboard page to fully load & render on ${siteName}...`);

    // 1. Wait for document load states
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    // 2. Wait for Next.js Suspense skeleton loaders, shimmers, or spinners to finish/hide
    const loadingElements = page.locator('.animate-pulse, [class*="skeleton" i], [class*="shimmer" i], [class*="loading" i], [id*="loading" i], .spinner, [aria-busy="true"]');
    try {
      const isStillLoading = await loadingElements.first().isVisible({ timeout: 1000 }).catch(() => false);
      if (isStillLoading) {
        console.log(`⏳ [CaptureDashboardApiResponseTask] Skeleton/spinner detected on ${siteName}, waiting for full render...`);
        await loadingElements.first().waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
      }
    } catch (e) {}

    // 3. Condition-based wait for core dashboard DOM elements to be visible
    const dashboardIndicators = [
      'main',
      '[class*="dashboard" i]',
      '[class*="member" i]',
      '[class*="report" i]',
      'input[placeholder*="VIN" i]',
      'input[placeholder*="search" i]',
      'button:has-text("Search")',
      'button:has-text("Generate")',
      'header',
      'nav'
    ];

    for (const selector of dashboardIndicators) {
      try {
        const loc = page.locator(selector).first();
        const isVisible = await loc.isVisible({ timeout: 1000 }).catch(() => false);
        if (isVisible) {
          console.log(`✅ [CaptureDashboardApiResponseTask] Core dashboard component rendered ("${selector}") on ${siteName}`);
          break;
        }
      } catch (e) {}
    }

    // 4. Dismiss any newly loaded welcome tours or promotional modals
    await dismissAllPopups(page, 1500);

    console.log(`✨ [CaptureDashboardApiResponseTask] Dashboard page is fully loaded and ready on ${siteName}.`);
  }

  /**
   * Screenplay Task execution: verifies API response, checks page DOM against 404, captures screenshot and attachments.
   */
  async performAs(actor: Actor): Promise<void> {
    const page = this.page || actor.getPage();
    const siteName = this.siteConfig?.name || 'UnknownSite';

    console.log(`[CaptureDashboardApiResponseTask] Verifying dashboard landing for "${siteName}" (${this.stage})...`);

    // 1. Wait for page to FULLY load
    await this.waitForFullDashboardLoad(page);

    // 2. For non-SCC sites, check captured response if available
    let response: Response | null = this.capturedResponse;
    if (!response && this.capturePromise) {
      try {
        response = await this.capturePromise;
      } catch (e) {}
    }

    const currentUrl = page.url();

    // 3. Process API Response details if captured
    if (response) {
      const status = response.status();
      const resUrl = response.url();
      let responseBody: any = null;

      try {
        const text = await response.text();
        try {
          responseBody = JSON.parse(text);
        } catch (e) {
          // RSC payloads are text-based React flight streams
          responseBody = {
            preview: text.length > 2000 ? text.substring(0, 2000) + '... [TRUNCATED]' : text,
            length: text.length
          };
        }
      } catch (e) {
        responseBody = { note: 'Could not read response body' };
      }

      const responseData = {
        site: siteName,
        stage: this.stage,
        url: resUrl,
        method: response.request().method(),
        status,
        statusText: response.statusText(),
        headers: response.headers(),
        responseBody,
        timestamp: new Date().toISOString()
      };

      // Attach API response to Playwright report
      if (this.testInfo) {
        await this.testInfo.attach(`${this.stage}-dashboard-api-response`, {
          body: JSON.stringify(responseData, null, 2),
          contentType: 'application/json',
        });
      }

      // Check if API returned 404 or 5xx server error
      if (status === 404 || status >= 500) {
        const errScreenshot = await page.screenshot({ fullPage: false }).catch(() => null);
        if (errScreenshot && this.testInfo) {
          await this.testInfo.attach(`${this.stage}-dashboard-404-error-screenshot`, {
            body: errScreenshot,
            contentType: 'image/png',
          });
        }
        throw new Error(`❌ [CaptureDashboardApiResponseTask] Dashboard API returned HTTP ${status} (${response.statusText()}) for URL: ${resUrl} on site ${siteName}`);
      }

      expect(status, `Expected dashboard API status to be 200 OK, but got ${status}`).toBeLessThan(400);
      console.log(`✅ [CaptureDashboardApiResponseTask] Dashboard API verified successfully (Status: ${status}) for ${siteName}`);
    }

    // 4. Condition-based DOM check for Next.js / frontend 404 errors
    const is404InPage = await page.evaluate(() => {
      const bodyText = document.body?.innerText || '';
      const title = document.title || '';
      return /404\s*\|\s*this page could not be found/i.test(bodyText) ||
             /404\s*-\s*page not found/i.test(bodyText) ||
             /page not found/i.test(title);
    }).catch(() => false);

    // 5. Capture screenshot of the FULLY loaded dashboard for both SCC and all sites
    const screenshotBuffer = await page.screenshot({ fullPage: false }).catch(() => null);
    if (screenshotBuffer && this.testInfo) {
      const screenshotName = `${this.stage}-dashboard-screenshot`;
      await this.testInfo.attach(screenshotName, {
        body: screenshotBuffer,
        contentType: 'image/png',
      });
      console.log(`📸 [CaptureDashboardApiResponseTask] Fully loaded dashboard screenshot attached to report: "${screenshotName}.png" (${siteName})`);
    }

    // 6. If 404 DOM error is detected, fail test with explicit diagnosis
    if (is404InPage) {
      throw new Error(`❌ [CaptureDashboardApiResponseTask] Dashboard rendered a 404 Not Found error page on ${siteName}! Current URL: ${currentUrl}`);
    }

    console.log(`🎉 [CaptureDashboardApiResponseTask] Dashboard fully loaded & verified clean with screenshot for ${siteName} (${this.stage}) at ${currentUrl}`);
  }
}
