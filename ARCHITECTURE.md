# 🏗️ Architecture Documentation

## Overview

This project implements **Clean Architecture** (Uncle Bob) and **Domain-Driven Design** (DDD) principles to create a maintainable, testable, and scalable backend system.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Controllers, HTTP, Swagger)         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Application Layer               │
│      (Use Cases, DTOs, Orchestration)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Domain Layer                  │
│  (Entities, Value Objects, Rules)       │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│       Infrastructure Layer              │
│  (Database, Repositories, External)     │
└─────────────────────────────────────────┘
```

## Dependency Rule

**The Dependency Rule**: Source code dependencies must point **inward** only.

- ✅ Domain doesn't depend on anything
- ✅ Application depends only on Domain
- ✅ Infrastructure depends on Domain (via interfaces)
- ✅ Presentation depends on Application

## Layer Details

### 1. Domain Layer 🎯 (Core Business Logic)

**Location**: `src/domain/`

**Responsibility**: Contains all business logic, completely isolated from external concerns.

#### Entities
- `Book.entity.ts` - Book aggregate with copy management
- `User.entity.ts` - User aggregate with loan limits
- `Loan.entity.ts` - Loan aggregate with fine calculation

**Key Characteristics**:
- Rich domain models (not anemic)
- Encapsulated business logic
- Self-validating
- Framework-agnostic

#### Value Objects
- `ISBN.vo.ts` - Immutable ISBN with validation
- `Email.vo.ts` - Immutable email with validation
- `LoanPeriod.vo.ts` - Strategy pattern for loan duration

**Key Characteristics**:
- Immutable
- Self-validating
- No identity (equality by value)
- Encapsulate validation logic

#### Interfaces
- `IBookRepository.ts`
- `IUserRepository.ts`
- `ILoanRepository.ts`

**Why Interfaces?**
- Dependency Inversion Principle (SOLID)
- Domain defines contracts
- Infrastructure implements contracts
- Easy to mock for testing

#### Business Rules
- `LoanRules.ts` - Centralized business validation

**Contains**:
- Can user borrow? (check limits, overdue, availability)
- Can book be returned?
- Fine calculation logic

---

### 2. Application Layer 🔄 (Use Cases)

**Location**: `src/application/`

**Responsibility**: Orchestrates domain objects to fulfill use cases.

#### Use Cases
- `CreateLoanUseCase.ts` - Orchestrates loan creation
- `ReturnBookUseCase.ts` - Orchestrates book return
- `GetUserLoansUseCase.ts` - Query user's loans
- `CheckBookAvailabilityUseCase.ts` - Check book availability

**Pattern**: Command/Query Responsibility Segregation (CQRS)
- Commands: CreateLoan, ReturnBook (write operations)
- Queries: GetUserLoans, CheckAvailability (read operations)

**Use Case Structure**:
```typescript
class CreateLoanUseCase {
  constructor(
    private bookRepo: IBookRepository,
    private userRepo: IUserRepository,
    private loanRepo: ILoanRepository,
  ) {}

  async execute(dto: CreateLoanDto): Promise<Loan> {
    // 1. Fetch entities (via repository interfaces)
    // 2. Validate business rules
    // 3. Execute business logic (domain methods)
    // 4. Persist changes (via repository interfaces)
    // 5. Return result
  }
}
```

#### DTOs (Data Transfer Objects)
- `CreateLoanDto.ts`
- `ReturnBookDto.ts`

**Purpose**:
- Validate input from external sources
- Decouple API contracts from domain
- Use `class-validator` for validation

---

### 3. Infrastructure Layer 🔧 (External Concerns)

**Location**: `src/infrastructure/`

**Responsibility**: Implements technical capabilities (database, external APIs, etc.)

#### Database Module
- `database.module.ts` - TypeORM configuration
- `BookEntity.ts` - Database model for Book
- `UserEntity.ts` - Database model for User
- `LoanEntity.ts` - Database model for Loan

**Why separate entities?**
- Domain entities ≠ Database entities
- Domain models are rich (behavior + data)
- Database models are simple (data only)
- Allows domain to evolve independently

#### Repositories
- `BookRepository.ts` - Implements `IBookRepository`
- `UserRepository.ts` - Implements `IUserRepository`
- `LoanRepository.ts` - Implements `ILoanRepository`

**Repository Pattern Benefits**:
- Abstracts data access
- Centralizes query logic
- Easy to switch databases
- Testable (can mock)

**Mapping Pattern**:
```typescript
class BookRepository implements IBookRepository {
  // Database Entity → Domain Entity
  private toDomain(entity: BookEntity): Book {
    return new Book(
      entity.id,
      ISBN.create(entity.isbn),
      // ...
    );
  }

  // Domain Entity → Database Entity
  private toEntity(book: Book): BookEntity {
    const entity = new BookEntity();
    entity.isbn = book.isbn.getValue();
    // ...
    return entity;
  }
}
```

---

### 4. Presentation Layer 🌐 (HTTP API)

**Location**: `src/presentation/`

**Responsibility**: Handle HTTP requests/responses, routing, validation.

#### Controllers
- `health.controller.ts` - Health check endpoint
- `loans.controller.ts` - Loan operations (create, return, list)
- `books.controller.ts` - Book queries

**Responsibilities**:
- Route HTTP requests
- Validate DTOs
- Call use cases
- Format responses
- Handle HTTP errors

**Example**:
```typescript
@Controller('loans')
class LoansController {
  constructor(private createLoanUseCase: CreateLoanUseCase) {}

  @Post()
  async create(@Body() dto: CreateLoanDto) {
    return await this.createLoanUseCase.execute(dto);
  }
}
```

---

## Design Patterns Used

### 1. Repository Pattern
**Where**: Infrastructure layer
**Why**: Abstract data access, enable testing, decouple domain from database

### 2. Value Object Pattern
**Where**: Domain layer (`ISBN`, `Email`, `LoanPeriod`)
**Why**: Encapsulate validation, ensure immutability, type safety

### 3. Strategy Pattern
**Where**: `LoanPeriod.forUserType()`
**Why**: Different loan durations for different user types

### 4. Factory Pattern
**Where**: `Loan.createNew()`
**Why**: Encapsulate complex object creation logic

### 5. Dependency Injection
**Where**: All layers (NestJS DI container)
**Why**: Loose coupling, testability, follows SOLID principles

### 6. CQRS (Light)
**Where**: Application layer
**Why**: Separate read (queries) from write (commands) operations

---

## SOLID Principles Application

### Single Responsibility Principle (SRP)
- Each use case has one responsibility
- Each entity manages its own state
- Repositories only handle persistence

### Open/Closed Principle (OCP)
- New user types: extend `UserType` enum + `LoanPeriod` strategy
- New repositories: implement `IRepository` interface
- No modification of existing code needed

### Liskov Substitution Principle (LSP)
- All repositories implement their interfaces correctly
- Can substitute any implementation without breaking system

### Interface Segregation Principle (ISP)
- Focused interfaces (`IBookRepository`, `IUserRepository`, etc.)
- Clients depend only on methods they use

### Dependency Inversion Principle (DIP)
- High-level modules (Application) depend on abstractions (interfaces)
- Low-level modules (Infrastructure) implement abstractions
- Domain defines contracts, Infrastructure implements them

---

## Data Flow

### Creating a Loan

```
1. HTTP Request (POST /loans)
   ↓
2. LoansController validates DTO
   ↓
3. CreateLoanUseCase.execute()
   ↓
4. Fetch entities via repositories (Infrastructure → Domain mapping)
   ↓
5. Validate business rules (LoanRules.canUserBorrowBook)
   ↓
6. Execute domain logic (book.decreaseAvailableCopies(), Loan.createNew())
   ↓
7. Persist via repositories (Domain → Infrastructure mapping)
   ↓
8. Return domain entity (converted to JSON by NestJS)
   ↓
9. HTTP Response (201 Created)
```

### Key Points:
- **Presentation** receives request, validates format
- **Application** orchestrates workflow
- **Domain** executes business logic
- **Infrastructure** handles persistence
- Data flows: Request → DTO → Domain → Response

---

## Testing Strategy

### Unit Tests (Domain)
- Test entities in isolation
- Test value objects
- Test business rules
- **No mocks needed** (pure domain logic)

### Unit Tests (Application)
- Test use cases with mocked repositories
- Verify orchestration logic
- Test error handling

### Integration Tests
- Test complete workflows
- Use real or in-memory database
- Verify end-to-end behavior

### Coverage Goals
- Domain: 100% (critical business logic)
- Application: 90%+ (use cases)
- Infrastructure: 80%+ (data access)
- Overall: 80%+ minimum

---

## Advantages of This Architecture

### 1. Testability
- Domain logic testable without infrastructure
- Use cases testable with mocked repositories
- Each layer independently testable

### 2. Maintainability
- Clear separation of concerns
- Easy to locate and modify logic
- Changes in one layer don't affect others

### 3. Scalability
- Easy to add new features (new use cases)
- Easy to switch technologies (new implementations)
- Domain remains stable

### 4. Team Collaboration
- Different teams can work on different layers
- Clear interfaces between layers
- Minimal merge conflicts

### 5. Business Alignment
- Domain layer reflects business language
- Easy for non-technical stakeholders to understand
- Business rules centralized and explicit

---

## Common Pitfalls to Avoid

### ❌ Don't Do This

1. **Anemic Domain Models**
   ```typescript
   // BAD: Just data, no behavior
   class Book {
     copies: number;
   }

   // GOOD: Rich domain model
   class Book {
     private copies: number;
     decreaseCopies() { /* logic */ }
   }
   ```

2. **Domain Depending on Infrastructure**
   ```typescript
   // BAD: Domain imports from infrastructure
   import { BookEntity } from '../infrastructure/...';

   // GOOD: Infrastructure depends on domain
   // Domain has NO imports from other layers
   ```

3. **Business Logic in Use Cases**
   ```typescript
   // BAD: Business logic in use case
   if (activeLoans.length >= 3) { /* ... */ }

   // GOOD: Delegate to domain
   LoanRules.canUserBorrowBook(...)
   ```

4. **Exposing Database Entities**
   ```typescript
   // BAD: Expose TypeORM entity
   async getBook(): Promise<BookEntity>

   // GOOD: Return domain entity
   async getBook(): Promise<Book>
   ```

---

## File Organization

```
src/
├── domain/                    # ✅ Business logic (no external deps)
│   ├── entities/             # Aggregates and entities
│   ├── value-objects/        # Immutable value objects
│   ├── interfaces/           # Repository contracts
│   └── rules/                # Business rules
│
├── application/              # 🔄 Use cases (depends on domain)
│   ├── use-cases/           # Application services
│   └── dtos/                # Data transfer objects
│
├── infrastructure/           # 🔧 External concerns (implements domain interfaces)
│   ├── database/
│   │   ├── entities/        # TypeORM entities
│   │   └── database.module.ts
│   └── repositories/        # Implement IRepository interfaces
│
├── presentation/             # 🌐 HTTP layer (depends on application)
│   └── controllers/         # NestJS controllers
│
├── app.module.ts            # Dependency injection setup
└── main.ts                  # Application bootstrap
```

---

## Further Reading

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

**Remember**: Architecture is about making future changes easier, not about following rules blindly. Understand the "why" behind each pattern.
