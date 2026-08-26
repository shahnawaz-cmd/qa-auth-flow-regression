import { Actor } from '../actors/Actor';

export class PhoneNumberGenerator {
  private phoneNumber: string;

  constructor() {
    this.phoneNumber = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
  }

  getPhoneNumber(): string {
    return this.phoneNumber;
  }

  async performAs(actor: Actor): Promise<void> {
    actor.phoneNumber = this.phoneNumber;
  }
}
