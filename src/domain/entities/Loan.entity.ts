import { LoanStatus } from './LoanStatus.enum';
import { LoanPeriod } from '../value-objects/LoanPeriod.vo';
import { UserType } from './UserType.enum';

export class Loan {
  private static readonly FINE_PER_DAY = 1.5; // $1.5 per day overdue

  constructor(
    public readonly id: string,
    public readonly bookId: string,
    public readonly userId: string,
    public readonly loanDate: Date,
    public readonly expectedReturnDate: Date,
    private returnDate: Date | null,
    private status: LoanStatus,
    private readonly userType: UserType,
  ) {
    this.validateLoan();
  }

  private validateLoan(): void {
    if (this.loanDate > this.expectedReturnDate) {
      throw new Error('Expected return date must be after loan date');
    }
  }

  public static createNew(
    id: string,
    bookId: string,
    userId: string,
    userType: UserType,
    loanDate: Date = new Date(),
  ): Loan {
    const loanPeriod = LoanPeriod.forUserType(userType);
    const expectedReturnDate = loanPeriod.calculateExpirationDate(loanDate);

    return new Loan(
      id,
      bookId,
      userId,
      loanDate,
      expectedReturnDate,
      null,
      LoanStatus.ACTIVE,
      userType,
    );
  }

  public getReturnDate(): Date | null {
    return this.returnDate;
  }

  public getUserType(): UserType {
    return this.userType;
  }

  public getStatus(): LoanStatus {
    return this.status;
  }

  public isActive(): boolean {
    return this.status === LoanStatus.ACTIVE;
  }

  public isReturned(): boolean {
    return this.status === LoanStatus.RETURNED;
  }

  public isOverdue(currentDate: Date = new Date()): boolean {
    if (this.isReturned()) {
      return false;
    }
    return currentDate > this.expectedReturnDate;
  }

  public markAsOverdue(): void {
    if (this.isReturned()) {
      throw new Error('Cannot mark returned loan as overdue');
    }
    this.status = LoanStatus.OVERDUE;
  }

  public returnBook(returnDate: Date = new Date()): void {
    if (this.isReturned()) {
      throw new Error('Loan is already returned');
    }

    if (returnDate < this.loanDate) {
      throw new Error('Return date cannot be before loan date');
    }

    this.returnDate = returnDate;
    this.status = LoanStatus.RETURNED;
  }

  public calculateFine(returnDate: Date = new Date()): number {
    if (!this.isReturned() && this.isOverdue(returnDate)) {
      const overdueDays = this.calculateOverdueDays(returnDate);
      return overdueDays * Loan.FINE_PER_DAY;
    }

    if (this.isReturned() && this.returnDate) {
      const overdueDays = this.calculateOverdueDays(this.returnDate);
      return overdueDays * Loan.FINE_PER_DAY;
    }

    return 0;
  }

  private calculateOverdueDays(checkDate: Date): number {
    if (checkDate <= this.expectedReturnDate) {
      return 0;
    }

    const diffTime = checkDate.getTime() - this.expectedReturnDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  public getDaysUntilDue(currentDate: Date = new Date()): number {
    if (this.isReturned()) {
      return 0;
    }

    const diffTime = this.expectedReturnDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
