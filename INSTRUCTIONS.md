# 📖 Implementation Instructions

## 🎯 Goal

Transform the failing tests (RED 🔴) into passing tests (GREEN ✅) by implementing the missing business logic in the Application and Infrastructure layers.

## 🍴 Before You Start: Fork the Repository

1. **Fork this repository** to your own GitHub account
   - Click the "Fork" button at the top right of the repository page

2. **Clone your fork**
   ```bash
   git clone git@github.com:YOUR_USERNAME/backend-developer.git
   cd backend-developer
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Setup environment**
   ```bash
   cp .env.example .env
   docker-compose up -d
   ```

Now you're ready to start coding!

---

## 📝 Step-by-Step Guide

### Phase 1: Understanding the Codebase (30 min)

#### 1.1 Study the Domain Layer ✅ (Fully Implemented)

**Entities** (`src/domain/entities/`):
- `Book.entity.ts` - Represents a book with ISBN, copies management
- `User.entity.ts` - User with type (STUDENT/TEACHER/ADMIN)
- `Loan.entity.ts` - Loan with dates, status, fine calculation

**Value Objects** (`src/domain/value-objects/`):
- `ISBN.vo.ts` - Immutable ISBN validator (ISBN-10/13)
- `Email.vo.ts` - Immutable email validator
- `LoanPeriod.vo.ts` - Strategy pattern for loan duration

**Business Rules** (`src/domain/rules/`):
- `LoanRules.ts` - Centralized business validation

#### 1.2 Understand Test Requirements

Run the tests to see what's failing:
```bash
npm test
```

You'll see **24 failing tests** distributed in:
- 4 tests for Book entity (PASSING - domain is complete)
- 4 tests for Loan entity (PASSING - domain is complete)
- 5 tests for CreateLoanUseCase (FAILING)
- 5 tests for ReturnBookUseCase (FAILING)
- 6 integration tests (FAILING)

---

### Phase 2: Implement Use Cases (2-4 hours)

#### 2.1 CreateLoanUseCase (`src/application/use-cases/CreateLoanUseCase.ts`)

**Requirements from tests:**
1. ✅ Create loan when all conditions are met
2. ✅ Reject if user exceeded max loans
3. ✅ Reject if book has no copies
4. ✅ Reject if user has overdue loans
5. ✅ Decrease book copies after creation

**Implementation steps (follow TODOs in file):**

```typescript
async execute(dto: CreateLoanDto): Promise<Loan> {
  // Step 1: Fetch book
  const book = await this.bookRepository.findById(dto.bookId);
  if (!book) throw new Error('Book not found');

  // Step 2: Fetch user
  const user = await this.userRepository.findById(dto.userId);
  if (!user) throw new Error('User not found');

  // Step 3: Get active loans
  const activeLoans = await this.loanRepository.findActiveByUserId(dto.userId);

  // Step 4: Get overdue loans
  const overdueLoans = await this.loanRepository.findOverdueByUserId(dto.userId);

  // Step 5: Validate business rules
  const validation = LoanRules.canUserBorrowBook(user, book, activeLoans, overdueLoans);
  if (!validation.canBorrow) {
    throw new Error(validation.reason);
  }

  // Step 6: Create loan (use uuid for ID)
  const loan = Loan.createNew(uuidv4(), dto.bookId, dto.userId, user.type);

  // Step 7: Decrease book copies
  book.decreaseAvailableCopies();

  // Step 8-9: Save loan and update book
  await this.loanRepository.save(loan);
  await this.bookRepository.update(book);

  // Step 10: Return loan
  return loan;
}
```

#### 2.2 ReturnBookUseCase (`src/application/use-cases/ReturnBookUseCase.ts`)

**Requirements from tests:**
1. ✅ Mark loan as returned
2. ✅ Increase book copies
3. ✅ Calculate fine if late
4. ✅ Reject if loan doesn't exist
5. ✅ Reject if already returned

**Key points:**
- Parse `returnDate` from ISO string if provided
- Use `loan.returnBook(date)` to mark as returned
- Use `loan.calculateFine()` to get fine amount
- Use `book.increaseAvailableCopies()` to return copy

#### 2.3 GetUserLoansUseCase & CheckBookAvailabilityUseCase

These are simpler queries:

```typescript
// GetUserLoansUseCase
async execute(userId: string): Promise<Loan[]> {
  return await this.loanRepository.findByUserId(userId);
}

// CheckBookAvailabilityUseCase
async execute(bookId: string): Promise<BookAvailability> {
  const book = await this.bookRepository.findById(bookId);
  if (!book) throw new Error('Book not found');

  return {
    bookId: book.id,
    title: book.title,
    availableCopies: book.getAvailableCopies(),
    totalCopies: book.totalCopies,
    isAvailable: book.hasAvailableCopies(),
  };
}
```

---

### Phase 3: Implement Repositories (2-4 hours)

#### 3.1 Understanding the Mapping

You need to convert between:
- **Domain entities** (`Book`, `User`, `Loan`) - rich domain models
- **Database entities** (`BookEntity`, `UserEntity`, `LoanEntity`) - TypeORM models

#### 3.2 BookRepository Implementation

**Required methods:**
```typescript
async findById(id: string): Promise<Book | null> {
  const entity = await this.bookEntityRepository.findOne({ where: { id } });
  if (!entity) return null;
  return this.toDomain(entity);
}

async update(book: Book): Promise<Book> {
  const entity = this.toEntity(book);
  await this.bookEntityRepository.save(entity);
  return book;
}

// Helper methods
private toDomain(entity: BookEntity): Book {
  return new Book(
    entity.id,
    ISBN.create(entity.isbn),
    entity.title,
    entity.author,
    entity.publicationYear,
    entity.category,
    entity.availableCopies,
    entity.totalCopies,
  );
}

private toEntity(book: Book): BookEntity {
  const entity = new BookEntity();
  entity.id = book.id;
  entity.isbn = book.isbn.getValue();
  entity.title = book.title;
  // ... etc
  return entity;
}
```

**Inject TypeORM repository:**
```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

constructor(
  @InjectRepository(BookEntity)
  private readonly bookEntityRepository: Repository<BookEntity>,
) {}
```

#### 3.3 LoanRepository Implementation

**Key methods to implement:**

```typescript
async findActiveByUserId(userId: string): Promise<Loan[]> {
  const entities = await this.loanEntityRepository.find({
    where: { userId, status: LoanStatus.ACTIVE },
  });
  return entities.map(e => this.toDomain(e));
}

async findOverdueByUserId(userId: string): Promise<Loan[]> {
  const entities = await this.loanEntityRepository.find({
    where: { userId, status: LoanStatus.OVERDUE },
  });
  return entities.map(e => this.toDomain(e));
}
```

**Important:** When converting to domain:
```typescript
private toDomain(entity: LoanEntity): Loan {
  return new Loan(
    entity.id,
    entity.bookId,
    entity.userId,
    entity.loanDate,
    entity.expectedReturnDate,
    entity.returnDate,
    entity.status as LoanStatus,
    entity.userType as UserType,
  );
}
```

#### 3.4 UserRepository Implementation

Similar pattern:
- Inject `UserEntity` repository
- Implement `toDomain()` and `toEntity()` mappers
- Use `Email.create()` when mapping to domain

---

### Phase 4: Run Tests and Debug (1-2 hours)

#### 4.1 Run Specific Test Suites

```bash
# Run only unit tests
npm test -- Book.spec

# Run only CreateLoanUseCase tests
npm test -- CreateLoanUseCase.spec

# Run with verbose output
npm test -- --verbose
```

#### 4.2 Common Issues and Solutions

**Issue 1: "Cannot inject IBookRepository"**
- Solution: Make sure `app.module.ts` has proper providers with `useClass`

**Issue 2: "Invalid ISBN format"**
- Solution: Use `ISBN.create()` method which validates

**Issue 3: "Cannot read property of undefined"**
- Solution: Check null handling in repositories

**Issue 4: TypeScript strict mode errors**
- Solution: Use proper types, avoid `any`, handle null cases

#### 4.3 Debug with Jest

```bash
# Run single test file in debug mode
npm run test:debug -- Book.spec

# Then attach debugger on port 9229
```

---

### Phase 5: Validation & Cleanup (30 min)

#### 5.1 Run Full Validation

```bash
npm run validate
```

This checks:
- ✅ TypeScript compilation
- ✅ ESLint rules
- ✅ All tests pass
- ✅ 80% coverage minimum

#### 5.2 Check Coverage

```bash
npm run test:cov
```

Coverage should be:
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+
- **Statements**: 80%+

#### 5.3 Optional: Test with Real Database

```bash
# Start database
docker-compose up -d

# Run seed
npm run seed

# Start server
npm run start:dev

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/books/{id}/availability
```

---

## ✅ Completion Checklist

Before submitting, ensure:

- [ ] All 24 tests are passing (green ✅)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Coverage is above 80%
- [ ] No use of `any` type
- [ ] Proper error handling
- [ ] All TODOs are removed
- [ ] Code follows SOLID principles

---

## 🎯 Success Criteria

| Criteria | Target | How to Check |
|----------|--------|--------------|
| Tests Passing | 24/24 | `npm test` |
| Coverage | 80%+ | `npm run test:cov` |
| Type Safety | No errors | `npm run type-check` |
| Code Quality | No errors | `npm run lint` |
| Architecture | Clean & DDD | Code review |

---

## 🚀 Next Steps

Once complete:
1. Run `npm run validate` - all should pass
2. Commit your code
3. (Optional) Deploy to show working API
4. Be ready to explain architectural decisions

**Good luck! 🎉**
