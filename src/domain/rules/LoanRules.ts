import { User } from '../entities/User.entity';
import { Book } from '../entities/Book.entity';
import { Loan } from '../entities/Loan.entity';

export class LoanRules {
  public static canUserBorrowBook(
    user: User,
    book: Book,
    activeLoans: Loan[],
    overdueLoans: Loan[],
  ): { canBorrow: boolean; reason?: string } {
    // Rule 1: Check if user has overdue loans
    if (overdueLoans.length > 0) {
      return {
        canBorrow: false,
        reason: 'User has overdue loans and cannot borrow more books until they are returned',
      };
    }

    // Rule 2: Check if book has available copies
    if (!book.hasAvailableCopies()) {
      return {
        canBorrow: false,
        reason: 'Book has no available copies',
      };
    }

    // Rule 3: Check if user has reached maximum active loans
    const maxLoans = user.getMaxActiveLoans();
    if (activeLoans.length >= maxLoans) {
      return {
        canBorrow: false,
        reason: `User has reached maximum active loans (${maxLoans} for ${user.type})`,
      };
    }

    return { canBorrow: true };
  }

  public static validateReturnBook(loan: Loan): { canReturn: boolean; reason?: string } {
    if (loan.isReturned()) {
      return {
        canReturn: false,
        reason: 'Loan is already returned',
      };
    }

    return { canReturn: true };
  }

  public static calculateFine(loan: Loan, returnDate: Date = new Date()): number {
    return loan.calculateFine(returnDate);
  }
}
