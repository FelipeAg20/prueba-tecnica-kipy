import { UserType } from '../entities/UserType.enum';

export class LoanPeriod {
  private static readonly STUDENT_DAYS = 14;
  private static readonly TEACHER_DAYS = 30;

  private readonly days: number;

  private constructor(days: number) {
    this.days = days;
  }

  public static forUserType(userType: UserType): LoanPeriod {
    switch (userType) {
      case UserType.STUDENT:
        return new LoanPeriod(this.STUDENT_DAYS);
      case UserType.TEACHER:
      case UserType.ADMIN:
        return new LoanPeriod(this.TEACHER_DAYS);
      default:
        throw new Error(`Unknown user type: ${String(userType)}`);
    }
  }

  public getDays(): number {
    return this.days;
  }

  public calculateExpirationDate(startDate: Date): Date {
    const expirationDate = new Date(startDate);
    expirationDate.setDate(expirationDate.getDate() + this.days);
    return expirationDate;
  }

  public isOverdue(loanDate: Date, currentDate: Date = new Date()): boolean {
    const expirationDate = this.calculateExpirationDate(loanDate);
    return currentDate > expirationDate;
  }

  public calculateOverdueDays(loanDate: Date, returnDate: Date): number {
    const expirationDate = this.calculateExpirationDate(loanDate);
    if (returnDate <= expirationDate) {
      return 0;
    }

    const diffTime = returnDate.getTime() - expirationDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
