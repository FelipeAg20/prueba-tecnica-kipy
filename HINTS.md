# 💡 Hints & Tips

> **Note**: Try to solve the challenge without these hints first! Only use them if you're stuck.

## General Hints

### 🎯 Hint 1: Start with the Domain
The domain layer is **fully implemented**. Spend time understanding it before writing code:
- Read entity constructors and methods
- Understand value object validations
- Study the business rules in `LoanRules.ts`

### 🎯 Hint 2: Follow the Flow
For each use case:
1. Understand what the test expects
2. Read the TODO comments in the use case
3. Implement step by step
4. Run the specific test to verify

### 🎯 Hint 3: Trust the Types
TypeScript will guide you:
- If it compiles, you're probably on the right track
- Strict mode catches many logic errors
- Use IDE autocomplete to discover methods

---

## Use Cases Hints

### CreateLoanUseCase Hints

#### 🔍 Hint: UUID Generation
```typescript
import { v4 as uuidv4 } from 'uuid';

const loanId = uuidv4(); // Generates a UUID v4
```

#### 🔍 Hint: Accessing Business Rules
```typescript
import { LoanRules } from '../../domain/rules/LoanRules';

const validation = LoanRules.canUserBorrowBook(user, book, activeLoans, overdueLoans);
if (!validation.canBorrow) {
  throw new Error(validation.reason);
}
```

#### 🔍 Hint: Creating a Loan
```typescript
const loan = Loan.createNew(
  uuidv4(),        // id
  dto.bookId,      // bookId
  dto.userId,      // userId
  user.type,       // userType (for loan period calculation)
);
```

#### 🔍 Hint: Error Messages
Tests expect specific error messages:
- `'Book not found'` - when book doesn't exist
- `'User not found'` - when user doesn't exist
- Or use the `validation.reason` from `LoanRules`

---

### ReturnBookUseCase Hints

#### 🔍 Hint: Parsing Return Date
```typescript
const returnDate = dto.returnDate
  ? new Date(dto.returnDate)  // Parse ISO string
  : new Date();               // Use current date
```

#### 🔍 Hint: Loan Return Flow
```typescript
// 1. Validate
const validation = LoanRules.validateReturnBook(loan);
if (!validation.canReturn) {
  throw new Error(validation.reason);
}

// 2. Return the book
loan.returnBook(returnDate);

// 3. Calculate fine
const fine = loan.calculateFine(); // Already calculated based on return date

// 4. Increase copies
book.increaseAvailableCopies();
```

#### 🔍 Hint: Return Type
```typescript
return {
  loan,  // The updated loan
  fine,  // Calculated fine amount
};
```

---

## Repository Implementation Hints

### General Repository Pattern

#### 🔍 Hint: Injecting TypeORM Repository
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookEntity } from '../database/entities/BookEntity';

@Injectable()
export class BookRepository implements IBookRepository {
  constructor(
    @InjectRepository(BookEntity)
    private readonly bookEntityRepository: Repository<BookEntity>,
  ) {}
}
```

#### 🔍 Hint: Domain ↔ Entity Mapping
```typescript
// Database → Domain
private toDomain(entity: BookEntity): Book {
  return new Book(
    entity.id,
    ISBN.create(entity.isbn),  // Create value object
    entity.title,
    entity.author,
    entity.publicationYear,
    entity.category,
    entity.availableCopies,
    entity.totalCopies,
  );
}

// Domain → Database
private toEntity(book: Book): BookEntity {
  const entity = new BookEntity();
  entity.id = book.id;
  entity.isbn = book.isbn.getValue();  // Extract value from VO
  entity.title = book.title;
  // ... etc
  return entity;
}
```

---

### BookRepository Hints

#### 🔍 Hint: findById
```typescript
async findById(id: string): Promise<Book | null> {
  const entity = await this.bookEntityRepository.findOne({
    where: { id }
  });

  if (!entity) return null;

  return this.toDomain(entity);
}
```

#### 🔍 Hint: update
```typescript
async update(book: Book): Promise<Book> {
  const entity = this.toEntity(book);
  await this.bookEntityRepository.save(entity);
  return book;
}
```

---

### UserRepository Hints

#### 🔍 Hint: Email Value Object
```typescript
private toDomain(entity: UserEntity): User {
  return new User(
    entity.id,
    entity.name,
    Email.create(entity.email),  // Create Email VO
    entity.type as UserType,     // Cast to enum
  );
}
```

---

### LoanRepository Hints

#### 🔍 Hint: findActiveByUserId
```typescript
async findActiveByUserId(userId: string): Promise<Loan[]> {
  const entities = await this.loanEntityRepository.find({
    where: {
      userId,
      status: LoanStatus.ACTIVE
    },
  });

  return entities.map(e => this.toDomain(e));
}
```

#### 🔍 Hint: findOverdueByUserId
```typescript
async findOverdueByUserId(userId: string): Promise<Loan[]> {
  const entities = await this.loanEntityRepository.find({
    where: {
      userId,
      status: LoanStatus.OVERDUE
    },
  });

  return entities.map(e => this.toDomain(e));
}
```

#### 🔍 Hint: Loan Mapping
```typescript
private toDomain(entity: LoanEntity): Loan {
  return new Loan(
    entity.id,
    entity.bookId,
    entity.userId,
    entity.loanDate,
    entity.expectedReturnDate,
    entity.returnDate,           // Can be null
    entity.status as LoanStatus,
    entity.userType as UserType,
  );
}
```

---

## Module Configuration Hints

### 🔍 Hint: Dependency Injection Setup

In `app.module.ts`, provide the implementations:

```typescript
providers: [
  // Use cases
  CreateLoanUseCase,
  ReturnBookUseCase,

  // Repository implementations
  {
    provide: IBookRepository,
    useClass: BookRepository,
  },
  // ... etc
]
```

**Why?** This tells NestJS to inject `BookRepository` when `IBookRepository` is requested.

---

## Common Errors & Solutions

### ❌ Error: "Cannot find name 'uuidv4'"
**Solution:**
```typescript
import { v4 as uuidv4 } from 'uuid';
```

### ❌ Error: "Property 'bookEntityRepository' has no initializer"
**Solution:** Use `!` operator:
```typescript
@InjectRepository(BookEntity)
private readonly bookEntityRepository!: Repository<BookEntity>;
```

### ❌ Error: "Cannot inject IBookRepository"
**Solution:** Check `app.module.ts` providers array has:
```typescript
{
  provide: IBookRepository,
  useClass: BookRepository,
}
```

### ❌ Error: Tests fail with "Cannot decrease copies"
**Solution:** Check if you're calling `book.decreaseAvailableCopies()` **before** checking availability

### ❌ Error: "Expected 7.5 but got 0" (fine calculation)
**Solution:** Make sure you're:
1. Parsing the return date correctly
2. Calling `loan.returnBook(returnDate)` BEFORE `loan.calculateFine()`

### ❌ Error: TypeScript "possibly null" errors
**Solution:** Add null checks:
```typescript
const book = await this.bookRepository.findById(dto.bookId);
if (!book) {
  throw new Error('Book not found');
}
// Now TypeScript knows book is not null
```

---

## Testing Tips

### 🧪 Tip: Run Single Test File
```bash
npm test -- CreateLoanUseCase.spec
```

### 🧪 Tip: Run Single Test Case
```bash
npm test -- -t "should create a loan successfully"
```

### 🧪 Tip: Watch Mode (Auto-rerun)
```bash
npm run test:watch
```

### 🧪 Tip: See What's Failing
```bash
npm test -- --verbose
```

### 🧪 Tip: Debug Test
Add `console.log()` in your code, or use:
```typescript
it('should...', async () => {
  const result = await useCase.execute(dto);
  console.log('Result:', result); // Will show in test output
  expect(result).toBeDefined();
});
```

---

## Performance Tips

### ⚡ Tip: Parallel Repository Calls
When fetching independent data:
```typescript
// ❌ Sequential (slower)
const book = await this.bookRepository.findById(dto.bookId);
const user = await this.userRepository.findById(dto.userId);

// ✅ Parallel (faster)
const [book, user] = await Promise.all([
  this.bookRepository.findById(dto.bookId),
  this.userRepository.findById(dto.userId),
]);
```

---

## Architecture Tips

### 🏗️ Tip: Keep Domain Pure
Domain entities should **never** import from:
- Infrastructure layer
- Application layer
- Presentation layer
- External libraries (except TypeScript)

### 🏗️ Tip: Use Value Objects for Validation
Don't validate in use cases:
```typescript
// ❌ Bad
if (!emailRegex.test(email)) throw new Error('Invalid email');

// ✅ Good
const emailVO = Email.create(email); // Throws if invalid
```

### 🏗️ Tip: Let Domain Objects Decide
```typescript
// ❌ Bad: Logic in use case
if (book.availableCopies > 0) { ... }

// ✅ Good: Ask the domain
if (book.hasAvailableCopies()) { ... }
```

---

## Still Stuck?

1. **Check the domain layer** - the answer is usually there
2. **Read the error message carefully** - it often tells you exactly what's wrong
3. **Look at the test** - it shows exactly what's expected
4. **Review ARCHITECTURE.md** - understand the pattern you should follow
5. **Use TypeScript autocomplete** - it shows available methods
6. **Run tests frequently** - fail fast, fix fast

---

## Pro Tips for Senior Developers

### 🎯 Bonus Challenge Ideas

Once you complete the basic challenge:

1. **Add Domain Events**
   - `BookLoanedEvent`, `BookReturnedEvent`
   - Emit events from domain entities
   - Handle in application layer

2. **Implement Query Layer (CQRS)**
   - Separate read models from write models
   - Create dedicated query repositories

3. **Add Saga Pattern**
   - Handle complex multi-step workflows
   - Implement compensating transactions

4. **Implement Specification Pattern**
   - Create reusable query specifications
   - `OverdueLoansSpecification`, `AvailableBooksSpecification`

---

**Remember**: The goal isn't just to make tests pass, but to understand WHY this architecture makes the code maintainable and scalable.

**Good luck! 🚀**
