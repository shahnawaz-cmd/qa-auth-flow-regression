import { Actor } from '../actors/Actor';
import { generateValidPassword } from './passwordHelper';

export class PasswordGenerator {
  private password: string = '';

  async performAs(actor: Actor): Promise<void> {
    this.password = generateValidPassword();
    actor.password = this.password;
  }

  getPassword(): string {
    return this.password;
  }
}
