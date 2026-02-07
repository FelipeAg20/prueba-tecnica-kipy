import { ReturnBookUseCase } from '../../../src/application/use-cases/ReturnBookUseCase';
import { IBookRepository } from '../../../src/domain/interfaces/IBookRepository';
import { ILoanRepository } from '../../../src/domain/interfaces/ILoanRepository';
import { Book } from '../../../src/domain/entities/Book.entity';
import { Loan } from '../../../src/domain/entities/Loan.entity';
import { ISBN } from '../../../src/domain/value-objects/ISBN.vo';
import { UserType } from '../../../src/domain/entities/UserType.enum';
import { ReturnBookDto } from '../../../src/application/dtos/ReturnBookDto';

describe('ReturnBookUseCase', () => {
  let useCase: ReturnBookUseCase;
  let bookRepository: jest.Mocked<IBookRepository>;
  let loanRepository: jest.Mocked<ILoanRepository>;

  beforeEach(() => {
    bookRepository = {
      findById: jest.fn(),
      findByISBN: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    loanRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findActiveByUserId: jest.fn(),
      findOverdueByUserId: jest.fn(),
      findByBookId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new ReturnBookUseCase(bookRepository, loanRepository);
  });

  it('should mark loan as returned', async () => {
    const loan = Loan.createNew('loan-id', 'book-id', 'user-id', UserType.STUDENT);
    const book = new Book(
      'book-id',
      ISBN.create('978-0-13-468599-1'),
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      2,
      5,
    );

    const dto: ReturnBookDto = {
      loanId: 'loan-id',
    };

    loanRepository.findById.mockResolvedValue(loan);
    bookRepository.findById.mockResolvedValue(book);
    loanRepository.update.mockImplementation(async (loan) => loan);
    bookRepository.update.mockImplementation(async (book) => book);

    const result = await useCase.execute(dto);

    expect(result.loan.isReturned()).toBe(true);
  });

  it('should increase book available copies', async () => {
    const loan = Loan.createNew('loan-id', 'book-id', 'user-id', UserType.STUDENT);
    const book = new Book(
      'book-id',
      ISBN.create('978-0-13-468599-1'),
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      2,
      5,
    );

    const dto: ReturnBookDto = {
      loanId: 'loan-id',
    };

    loanRepository.findById.mockResolvedValue(loan);
    bookRepository.findById.mockResolvedValue(book);
    loanRepository.update.mockImplementation(async (loan) => loan);
    bookRepository.update.mockImplementation(async (book) => book);

    await useCase.execute(dto);

    expect(book.getAvailableCopies()).toBe(3);
  });

  it('should calculate fine if returned late', async () => {
    const loanDate = new Date('2024-01-01');
    const loan = Loan.createNew('loan-id', 'book-id', 'user-id', UserType.STUDENT, loanDate);
    const book = new Book(
      'book-id',
      ISBN.create('978-0-13-468599-1'),
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      2,
      5,
    );

    const dto: ReturnBookDto = {
      loanId: 'loan-id',
      returnDate: '2024-01-20T00:00:00.000Z', // 5 days overdue
    };

    loanRepository.findById.mockResolvedValue(loan);
    bookRepository.findById.mockResolvedValue(book);
    loanRepository.update.mockImplementation(async (loan) => loan);
    bookRepository.update.mockImplementation(async (book) => book);

    const result = await useCase.execute(dto);

    expect(result.fine).toBe(7.5); // 5 days * $1.5
  });

  it('should throw error if loan does not exist', async () => {
    const dto: ReturnBookDto = {
      loanId: 'non-existent-loan',
    };

    loanRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toThrow('Loan not found');
  });

  it('should throw error if loan is already returned', async () => {
    const loan = Loan.createNew('loan-id', 'book-id', 'user-id', UserType.STUDENT);
    loan.returnBook(); // Mark as returned

    const dto: ReturnBookDto = {
      loanId: 'loan-id',
    };

    loanRepository.findById.mockResolvedValue(loan);

    await expect(useCase.execute(dto)).rejects.toThrow();
  });
});
