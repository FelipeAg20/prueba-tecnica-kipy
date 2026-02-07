import { CreateLoanUseCase } from '../../../src/application/use-cases/CreateLoanUseCase';
import { IBookRepository } from '../../../src/domain/interfaces/IBookRepository';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { ILoanRepository } from '../../../src/domain/interfaces/ILoanRepository';
import { Book } from '../../../src/domain/entities/Book.entity';
import { User } from '../../../src/domain/entities/User.entity';
import { Loan } from '../../../src/domain/entities/Loan.entity';
import { ISBN } from '../../../src/domain/value-objects/ISBN.vo';
import { Email } from '../../../src/domain/value-objects/Email.vo';
import { UserType } from '../../../src/domain/entities/UserType.enum';
import { CreateLoanDto } from '../../../src/application/dtos/CreateLoanDto';

describe('CreateLoanUseCase', () => {
  let useCase: CreateLoanUseCase;
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

    useCase = new CreateLoanUseCase(bookRepository, userRepository, loanRepository);
  });

  it('should create a loan successfully when all conditions are met', async () => {
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

    const dto: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-id',
    };

    bookRepository.findById.mockResolvedValue(book);
    userRepository.findById.mockResolvedValue(user);
    loanRepository.findActiveByUserId.mockResolvedValue([]);
    loanRepository.findOverdueByUserId.mockResolvedValue([]);
    loanRepository.save.mockImplementation(async (loan) => loan);
    bookRepository.update.mockImplementation(async (book) => book);

    const result = await useCase.execute(dto);

    expect(result).toBeDefined();
    expect(result.userId).toBe('user-id');
    expect(result.bookId).toBe('book-id');
    expect(loanRepository.save).toHaveBeenCalled();
    expect(bookRepository.update).toHaveBeenCalled();
  });

  it('should throw error if user has reached maximum loans', async () => {
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

    const dto: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-id',
    };

    bookRepository.findById.mockResolvedValue(book);
    userRepository.findById.mockResolvedValue(user);
    loanRepository.findActiveByUserId.mockResolvedValue(existingLoans);
    loanRepository.findOverdueByUserId.mockResolvedValue([]);

    await expect(useCase.execute(dto)).rejects.toThrow();
  });

  it('should throw error if book has no available copies', async () => {
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

    const dto: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-id',
    };

    bookRepository.findById.mockResolvedValue(book);
    userRepository.findById.mockResolvedValue(user);
    loanRepository.findActiveByUserId.mockResolvedValue([]);
    loanRepository.findOverdueByUserId.mockResolvedValue([]);

    await expect(useCase.execute(dto)).rejects.toThrow();
  });

  it('should throw error if user has overdue loans', async () => {
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

    const dto: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-id',
    };

    bookRepository.findById.mockResolvedValue(book);
    userRepository.findById.mockResolvedValue(user);
    loanRepository.findActiveByUserId.mockResolvedValue([]);
    loanRepository.findOverdueByUserId.mockResolvedValue([overdueLoan]);

    await expect(useCase.execute(dto)).rejects.toThrow();
  });

  it('should decrease book available copies after loan creation', async () => {
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

    const dto: CreateLoanDto = {
      bookId: 'book-id',
      userId: 'user-id',
    };

    bookRepository.findById.mockResolvedValue(book);
    userRepository.findById.mockResolvedValue(user);
    loanRepository.findActiveByUserId.mockResolvedValue([]);
    loanRepository.findOverdueByUserId.mockResolvedValue([]);
    loanRepository.save.mockImplementation(async (loan) => loan);
    bookRepository.update.mockImplementation(async (book) => book);

    await useCase.execute(dto);

    expect(book.getAvailableCopies()).toBe(2);
  });
});
