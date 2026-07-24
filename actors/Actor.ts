import { Page } from '@playwright/test';

export class Actor {
  private page: Page;
  public name: string;

  constructor(name: string, page: Page) {
    this.name = name;
    this.page = page;
  }

  // This allows the actor to execute an Action or Task (e.g., actor.attemptsTo(new Login()))
  async attemptsTo(activity: { performAs: (actor: Actor) => Promise<void> }) {
    await activity.performAs(this);
  }

  // This allows the actor to run a Question (e.g., actor.asks(new PageTitle()))
  async asks(question: { answeredBy: (actor: Actor) => Promise<any> }) {
    return await question.answeredBy(this);
  }

  // Expose the page so Tasks/Actions can interact with it
  getPage(): Page {
    return this.page;
  }
}
