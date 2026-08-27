import { Page } from '@playwright/test';
import { registerAutoPopupHandlers, dismissAllPopups } from '../tasks/DismissPopupTask';

export class Actor {
  public page: Page;
  public name: string;
  public email?: string;
  public password?: string;
  public phoneNumber?: string;
  public baseUrl?: string;

  constructor(name: string, page: Page) {
    this.name = name;
    this.page = page;
    registerAutoPopupHandlers(page);
  }

  // Helper method to dismiss any active popups/cookies on current page
  async dismissPopups(timeout: number = 2000): Promise<boolean> {
    return await dismissAllPopups(this.page, timeout);
  }

  // Execute an Action or Task (e.g., actor.attemptsTo(new SignupTask(...)))
  async attemptsTo(activity: { performAs: (actor: Actor) => Promise<void> }): Promise<void> {
    await activity.performAs(this);
  }

  // Run a Question (e.g., actor.asks(new PageTitle()))
  async asks(question: { answeredBy: (actor: Actor) => Promise<any> }): Promise<any> {
    return await question.answeredBy(this);
  }

  // Expose page instance
  getPage(): Page {
    return this.page;
  }
}
