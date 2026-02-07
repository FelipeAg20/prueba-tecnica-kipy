import { Email } from '../value-objects/Email.vo';
import { UserType } from './UserType.enum';

export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: Email,
    public readonly type: UserType,
  ) {
    this.validateUser();
  }

  private validateUser(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('User name cannot be empty');
    }

    if (!Object.values(UserType).includes(this.type)) {
      throw new Error('Invalid user type');
    }
  }

  public getMaxActiveLoans(): number {
    switch (this.type) {
      case UserType.STUDENT:
        return 3;
      case UserType.TEACHER:
        return 5;
      case UserType.ADMIN:
        return 10;
      default:
        throw new Error(`Unknown user type: ${String(this.type)}`);
    }
  }

  public isStudent(): boolean {
    return this.type === UserType.STUDENT;
  }

  public isTeacher(): boolean {
    return this.type === UserType.TEACHER;
  }

  public isAdmin(): boolean {
    return this.type === UserType.ADMIN;
  }
}
