import { Actor } from '../actors/Actor';

export class LogoutTask {
  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    // Ponytail: Clear local state directly. UI logout button is fragile.
    await page.context().clearCookies();
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
  }
}
