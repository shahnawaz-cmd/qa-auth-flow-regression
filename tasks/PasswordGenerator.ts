import { Actor } from '../actors/Actor';
import { generateValidPassword } from './passwordHelper';

export class PasswordGenerator {
  private password: string = '';

  async performAs(actor: Actor): Promise<void> {
    const timeout = setTimeout(() => { throw new Error('PasswordGenerator timed out'); }, 5000);
    this.password = generateValidPassword();
    clearTimeout(timeout);
  }

  getPassword(): string {
    return this.password;
  }
}
