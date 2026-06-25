export class User {
  public readonly email: string;
  public readonly password: string;

  constructor(email: string, password: string) {
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }
    if (password.length < 8) {
      throw new Error('Password too short');
    }
    this.email = email;
    this.password = password;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
