import { Page } from '@playwright/test';

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
