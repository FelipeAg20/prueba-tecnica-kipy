import { Loan } from '../../../../src/domain/entities/Loan.entity';
import { UserType } from '../../../../src/domain/entities/UserType.enum';

describe('Loan Entity', () => {
  it('should create a loan with correct expiration date for STUDENT', () => {
    const loanDate = new Date('2024-01-01');
    const loan = Loan.createNew(
      '123e4567-e89b-12d3-a456-426614174000',
      'book-id',
      'user-id',
      UserType.STUDENT,
      loanDate,
    );

    const expectedDate = new Date('2024-01-15'); // 14 days later
    expect(loan.expectedReturnDate.toDateString()).toBe(expectedDate.toDateString());
  });

  it('should create a loan with correct expiration date for TEACHER', () => {
    const loanDate = new Date('2024-01-01');
    const loan = Loan.createNew(
      '123e4567-e89b-12d3-a456-426614174000',
      'book-id',
      'user-id',
      UserType.TEACHER,
      loanDate,
    );

    const expectedDate = new Date('2024-01-31'); // 30 days later
    expect(loan.expectedReturnDate.toDateString()).toBe(expectedDate.toDateString());
  });

  it('should mark loan as overdue after expiration date', () => {
    const loanDate = new Date('2024-01-01');
    const loan = Loan.createNew(
      '123e4567-e89b-12d3-a456-426614174000',
      'book-id',
      'user-id',
      UserType.STUDENT,
      loanDate,
    );

    const currentDate = new Date('2024-01-20'); // 5 days overdue
    expect(loan.isOverdue(currentDate)).toBe(true);
  });

  it('should calculate fine for overdue loans', () => {
    const loanDate = new Date('2024-01-01');
    const loan = Loan.createNew(
      '123e4567-e89b-12d3-a456-426614174000',
      'book-id',
      'user-id',
      UserType.STUDENT,
      loanDate,
    );

    const returnDate = new Date('2024-01-20'); // 5 days overdue (expected: Jan 15)
    loan.returnBook(returnDate);

    const fine = loan.calculateFine();
    expect(fine).toBe(7.5); // 5 days * $1.5 per day
  });
});
