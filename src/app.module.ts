import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthController } from './presentation/controllers/health.controller';
import { LoansController } from './presentation/controllers/loans.controller';
import { BooksController } from './presentation/controllers/books.controller';
import { CreateLoanUseCase } from './application/use-cases/CreateLoanUseCase';
import { ReturnBookUseCase } from './application/use-cases/ReturnBookUseCase';
import { GetUserLoansUseCase } from './application/use-cases/GetUserLoansUseCase';
import { CheckBookAvailabilityUseCase } from './application/use-cases/CheckBookAvailabilityUseCase';
import { BookRepository } from './infrastructure/repositories/BookRepository';
import { UserRepository } from './infrastructure/repositories/UserRepository';
import { LoanRepository } from './infrastructure/repositories/LoanRepository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  controllers: [HealthController, LoansController, BooksController],
  providers: [
    CreateLoanUseCase,
    ReturnBookUseCase,
    GetUserLoansUseCase,
    CheckBookAvailabilityUseCase,
    BookRepository,
    UserRepository,
    LoanRepository,
  ],
})
export class AppModule {}
