import { Actor } from '../actors/Actor';
import { generateValidEmail } from './emailHelper';

export class EmailGenerator {
  private email: string = '';

  async performAs(actor: Actor): Promise<void> {
    const timeout = setTimeout(() => { throw new Error('EmailGenerator timed out'); }, 5000);
    this.email = generateValidEmail();
    clearTimeout(timeout);
  }

  getEmail(): string {
    return this.email;
  }
}
