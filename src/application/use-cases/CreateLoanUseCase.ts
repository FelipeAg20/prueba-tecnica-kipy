import { Inject, Injectable } from '@nestjs/common';
import { BookRepository } from '../../infrastructure/repositories/BookRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { LoanRepository } from '../../infrastructure/repositories/LoanRepository';
import { Loan } from '../../domain/entities/Loan.entity';
import { CreateLoanDto } from '../dtos/CreateLoanDto';
import { LoanRules } from '../../domain/rules/LoanRules';
import { randomUUID } from 'crypto';
import { IBookRepository } from '../../domain/interfaces/IBookRepository';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ILoanRepository } from '../../domain/interfaces/ILoanRepository';

@Injectable()
export class CreateLoanUseCase {
  constructor(
    @Inject(BookRepository)
    private readonly bookRepository: IBookRepository,
    @Inject(UserRepository)
    private readonly userRepository: IUserRepository,
    @Inject(LoanRepository)
    private readonly loanRepository: ILoanRepository,
  ) {}

  async execute(dto: CreateLoanDto): Promise<Loan> {
    const book = await this.bookRepository.findById(dto.bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const [activeLoans, overdueLoans] = await Promise.all([
      this.loanRepository.findActiveByUserId(dto.userId),
      this.loanRepository.findOverdueByUserId(dto.userId),
    ]);

    const validation = LoanRules.canUserBorrowBook(user, book, activeLoans, overdueLoans);
    if (!validation.canBorrow) {
      throw new Error(validation.reason ?? 'User cannot borrow this book');
    }

    const loan = Loan.createNew(randomUUID(), dto.bookId, dto.userId, user.type);

    book.decreaseAvailableCopies();

    await Promise.all([this.loanRepository.save(loan), this.bookRepository.update(book)]);

    return loan;
  }
}
