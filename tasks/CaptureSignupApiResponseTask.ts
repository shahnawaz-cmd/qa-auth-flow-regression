import { Actor } from '../actors/Actor';
import { TestInfo } from '@playwright/test';

export class CaptureSignupApiResponseTask {
  constructor(private testInfo: any, private siteConfig: any) {}

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();

    // Intercept the registration request dynamically
    const response = await page.waitForResponse(
      (response) => response.url().includes(this.siteConfig.apiEndpoint) && response.request().method() === 'POST'
    );

    const request = response.request();
    
    const rawPayload = request.postData() || '{}';
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(rawPayload);
    } catch (e) {
      parsedPayload = { raw: rawPayload }; // Fallback if not JSON
    }
    
    const data = {
      url: response.url(),
      requestPayload: parsedPayload,
      responseBody: await response.json(),
      status: response.status()
    };

    // Attach to report
    await this.testInfo.attach('signup-api-response', {
      body: JSON.stringify(data, null, 2),
      contentType: 'application/json',
    });
  }
}
