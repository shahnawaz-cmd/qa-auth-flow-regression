import { Actor } from '../actors/Actor';
import { generateValidEmail } from './emailHelper';

export class EmailGenerator {
  private email: string = '';

  async performAs(actor: Actor): Promise<void> {
    this.email = generateValidEmail();
    actor.email = this.email;
  }

  getEmail(): string {
    return this.email;
  }
}
