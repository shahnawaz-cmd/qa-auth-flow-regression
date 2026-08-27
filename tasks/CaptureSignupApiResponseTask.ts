import { Actor } from '../actors/Actor';
import { TestInfo } from '@playwright/test';

export class CaptureSignupApiResponseTask {
  constructor(
    private testInfo: any,
    private siteConfig: any,
    private timeout: number = 60000
  ) {}

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { apiEndpoint, name } = this.siteConfig;

    if (!apiEndpoint) {
      console.log(`[CaptureSignupApiResponseTask] No apiEndpoint defined for ${name}, skipping capture.`);
      return;
    }

    try {
      // Intercept the registration request dynamically with timeout protection
      const response = await page.waitForResponse(
        (response) => response.url().includes(apiEndpoint) && response.request().method() === 'POST',
        { timeout: this.timeout }
      );

      const request = response.request();
      const rawPayload = request.postData() || '{}';
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(rawPayload);
      } catch (e) {
        parsedPayload = { raw: rawPayload };
      }

      let responseBody: any;
      try {
        responseBody = await response.json();
      } catch (e) {
        responseBody = { text: await response.text().catch(() => '') };
      }

      const data = {
        url: response.url(),
        requestPayload: parsedPayload,
        responseBody,
        status: response.status()
      };

      // Attach to report
      if (this.testInfo) {
        await this.testInfo.attach('signup-api-response', {
          body: JSON.stringify(data, null, 2),
          contentType: 'application/json',
        });
      }
      console.log(`✅ [CaptureSignupApiResponseTask] Captured signup API response for ${name} (Status: ${response.status()})`);
    } catch (err: any) {
      console.warn(`⚠️ [CaptureSignupApiResponseTask] Failed or timed out capturing API response for ${name}: ${err.message}`);
    }
  }
}
