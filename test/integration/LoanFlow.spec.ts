import { CreateLoanUseCase } from '../../src/application/use-cases/CreateLoanUseCase';
import { ReturnBookUseCase } from '../../src/application/use-cases/ReturnBookUseCase';
import { IBookRepository } from '../../src/domain/interfaces/IBookRepository';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { ILoanRepository } from '../../src/domain/interfaces/ILoanRepository';
import { Book } from '../../src/domain/entities/Book.entity';
import { User } from '../../src/domain/entities/User.entity';
import { Loan } from '../../src/domain/entities/Loan.entity';
import { ISBN } from '../../src/domain/value-objects/ISBN.vo';
import { Email } from '../../src/domain/value-objects/Email.vo';
import { UserType } from '../../src/domain/entities/UserType.enum';
import { CreateLoanDto } from '../../src/application/dtos/CreateLoanDto';
import { ReturnBookDto } from '../../src/application/dtos/ReturnBookDto';

describe('Loan Flow Integration', () => {
  let createLoanUseCase: CreateLoanUseCase;
  let returnBookUseCase: ReturnBookUseCase;
  let bookRepository: jest.Mocked<IBookRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
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

    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
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

    createLoanUseCase = new CreateLoanUseCase(bookRepository, userRepository, loanRepository);
    returnBookUseCase = new ReturnBookUseCase(bookRepository, loanRepository);
  });

  it('should complete full loan cycle: create -> return', async () => {
    const book = new Book(
      'book-id',
      ISBN.create('978-0-13-468599-1'),
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      3,
      5,
    );

    const user = new User(
      'user-id',
      'John Doe',
      Email.create('john@example.com'),
      UserType.STUDENT,
    );

    // Setup mocks for loan creation
    bookRepository.findById.mockResolvedValue(book);
    userRepository.findById.mockResolvedValue(user);
    loanRepository.findActiveByUserId.mockResolvedValue([]);
    loanRepository.findOverdueByUserId.mockResolvedValue([]);
    loanRepository.save.mockImplementation(async (loan) => loan);
    bookRepository.update.mockImplementation(async (book) => book);

    // Create loan
    const createDto: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-id',
    };

    const createdLoan = await createLoanUseCase.execute(createDto);
    expect(createdLoan).toBeDefined();
    expect(book.getAvailableCopies()).toBe(2);

    // Setup mocks for loan return
    loanRepository.findById.mockResolvedValue(createdLoan);
    loanRepository.update.mockImplementation(async (loan) => loan);

    // Return book
    const returnDto: ReturnBookDto = {
      loanId: createdLoan.id,
    };

    const returnResult = await returnBookUseCase.execute(returnDto);
    expect(returnResult.loan.isReturned()).toBe(true);
    expect(book.getAvailableCopies()).toBe(3);
  });

  it('should prevent loan when user exceeds limit', async () => {
    const book = new Book(
      'book-id',
      ISBN.create('978-0-13-468599-1'),
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      3,
      5,
    );

    const user = new User(
      'user-id',
      'John Doe',
      Email.create('john@example.com'),
      UserType.STUDENT,
    );

    const existingLoans = [
      Loan.createNew('loan-1', 'book-1', 'user-id', UserType.STUDENT),
      Loan.createNew('loan-2', 'book-2', 'user-id', UserType.STUDENT),
      Loan.createNew('loan-3', 'book-3', 'user-id', UserType.STUDENT),
    ];

    bookRepository.findById.mockResolvedValue(book);
    userRepository.findById.mockResolvedValue(user);
    loanRepository.findActiveByUserId.mockResolvedValue(existingLoans);
    loanRepository.findOverdueByUserId.mockResolvedValue([]);

    const dto: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-id',
    };

    await expect(createLoanUseCase.execute(dto)).rejects.toThrow();
  });

  it('should prevent loan when no copies available', async () => {
    const book = new Book(
      'book-id',
      ISBN.create('978-0-13-468599-1'),
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      0,
      5,
    );

    const user = new User(
      'user-id',
      'John Doe',
      Email.create('john@example.com'),
      UserType.STUDENT,
    );

    bookRepository.findById.mockResolvedValue(book);
    userRepository.findById.mockResolvedValue(user);
    loanRepository.findActiveByUserId.mockResolvedValue([]);
    loanRepository.findOverdueByUserId.mockResolvedValue([]);

    const dto: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-id',
    };

    await expect(createLoanUseCase.execute(dto)).rejects.toThrow();
  });

  it('should calculate correct fine for late return', async () => {
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

    loanRepository.findById.mockResolvedValue(loan);
    bookRepository.findById.mockResolvedValue(book);
    loanRepository.update.mockImplementation(async (loan) => loan);
    bookRepository.update.mockImplementation(async (book) => book);

    const returnDto: ReturnBookDto = {
      loanId: 'loan-id',
      returnDate: '2024-01-20T00:00:00.000Z', // 5 days overdue
    };

    const result = await returnBookUseCase.execute(returnDto);

    expect(result.fine).toBe(7.5); // 5 days * $1.5
  });

  it('should allow new loan after returning overdue book', async () => {
    const book = new Book(
      'book-id',
      ISBN.create('978-0-13-468599-1'),
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      3,
      5,
    );

    const user = new User(
      'user-id',
      'John Doe',
      Email.create('john@example.com'),
      UserType.STUDENT,
    );

    const overdueLoan = Loan.createNew(
      'overdue-loan',
      'book-1',
      'user-id',
      UserType.STUDENT,
      new Date('2024-01-01'),
    );

    // First try to create loan - should fail due to overdue
    bookRepository.findById.mockResolvedValue(book);
    userRepository.findById.mockResolvedValue(user);
    loanRepository.findActiveByUserId.mockResolvedValue([]);
    loanRepository.findOverdueByUserId.mockResolvedValue([overdueLoan]);

    const dto: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-id',
    };

    await expect(createLoanUseCase.execute(dto)).rejects.toThrow();

    // Return overdue book
    overdueLoan.returnBook();

    // Now should be able to create new loan
    loanRepository.findOverdueByUserId.mockResolvedValue([]);
    loanRepository.save.mockImplementation(async (loan) => loan);
    bookRepository.update.mockImplementation(async (book) => book);

    const newLoan = await createLoanUseCase.execute(dto);
    expect(newLoan).toBeDefined();
  });

  it('should handle concurrent loan requests correctly', async () => {
    const book = new Book(
      'book-id',
      ISBN.create('978-0-13-468599-1'),
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      1, // Only 1 copy available
      5,
    );

    const user1 = new User(
      'user-1',
      'John Doe',
      Email.create('john@example.com'),
      UserType.STUDENT,
    );
    const user2 = new User(
      'user-2',
      'Jane Smith',
      Email.create('jane@example.com'),
      UserType.STUDENT,
    );

    bookRepository.findById.mockResolvedValue(book);
    loanRepository.findActiveByUserId.mockResolvedValue([]);
    loanRepository.findOverdueByUserId.mockResolvedValue([]);
    loanRepository.save.mockImplementation(async (loan) => loan);
    bookRepository.update.mockImplementation(async (book) => book);

    // First user borrows successfully
    userRepository.findById.mockResolvedValue(user1);
    const dto1: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-1',
    };

    const loan1 = await createLoanUseCase.execute(dto1);
    expect(loan1).toBeDefined();
    expect(book.getAvailableCopies()).toBe(0);

    // Second user tries to borrow - should fail
    userRepository.findById.mockResolvedValue(user2);
    const dto2: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-2',
    };

    await expect(createLoanUseCase.execute(dto2)).rejects.toThrow();
  });
});
