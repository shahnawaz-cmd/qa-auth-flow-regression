import { Actor } from '../actors/Actor';

export class LogoutTask {
  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    console.log('[LogoutTask] Clearing session, cookies, and local storage...');
    try {
      await page.context().clearCookies().catch(() => {});
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
      }).catch(() => {});
    } catch (err) {
      console.warn('[LogoutTask] Warning during session clear:', err);
    }
  }
}
