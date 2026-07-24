export class PhoneNumberGenerator {
  private phoneNumber: string;

  constructor() {
    // Generate a random 10-digit string
    this.phoneNumber = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
  }

  getPhoneNumber(): string {
    return this.phoneNumber;
  }

  async performAs(actor: any): Promise<void> {
    return Promise.resolve();
  }
}
