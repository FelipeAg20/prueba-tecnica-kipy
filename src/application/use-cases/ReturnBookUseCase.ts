import { Inject, Injectable } from '@nestjs/common';
import { BookRepository } from '../../infrastructure/repositories/BookRepository';
import { LoanRepository } from '../../infrastructure/repositories/LoanRepository';
import { Loan } from '../../domain/entities/Loan.entity';
import { ReturnBookDto } from '../dtos/ReturnBookDto';
import { LoanRules } from '../../domain/rules/LoanRules';
import { IBookRepository } from '../../domain/interfaces/IBookRepository';
import { ILoanRepository } from '../../domain/interfaces/ILoanRepository';

export interface ReturnBookResult {
  loan: Loan;
  fine: number;
}

@Injectable()
export class ReturnBookUseCase {
  constructor(
    @Inject(BookRepository)
    private readonly bookRepository: IBookRepository,
    @Inject(LoanRepository)
    private readonly loanRepository: ILoanRepository,
  ) {}

  async execute(dto: ReturnBookDto): Promise<ReturnBookResult> {
    const loan = await this.loanRepository.findById(dto.loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    const validation = LoanRules.validateReturnBook(loan);
    if (!validation.canReturn) {
      throw new Error(validation.reason ?? 'Loan cannot be returned');
    }

    const book = await this.bookRepository.findById(loan.bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    const returnDate = dto.returnDate ? new Date(dto.returnDate) : new Date();
    if (Number.isNaN(returnDate.getTime())) {
      throw new Error('Invalid return date');
    }

    loan.returnBook(returnDate);
    const fine = LoanRules.calculateFine(loan);

    book.increaseAvailableCopies();

    await Promise.all([this.loanRepository.update(loan), this.bookRepository.update(book)]);

    return { loan, fine };
  }
}
