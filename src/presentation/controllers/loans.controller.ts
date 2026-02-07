import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateLoanUseCase } from '../../application/use-cases/CreateLoanUseCase';
import { ReturnBookUseCase } from '../../application/use-cases/ReturnBookUseCase';
import { GetUserLoansUseCase } from '../../application/use-cases/GetUserLoansUseCase';
import { CreateLoanDto } from '../../application/dtos/CreateLoanDto';
import { ReturnBookDto } from '../../application/dtos/ReturnBookDto';
import { Loan } from '../../domain/entities/Loan.entity';
import { ReturnBookResult } from '../../application/use-cases/ReturnBookUseCase';

@Controller('loans')
export class LoansController {
  constructor(
    private readonly createLoanUseCase: CreateLoanUseCase,
    private readonly returnBookUseCase: ReturnBookUseCase,
    private readonly getUserLoansUseCase: GetUserLoansUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLoan(@Body() createLoanDto: CreateLoanDto): Promise<Loan> {
    return await this.createLoanUseCase.execute(createLoanDto);
  }

  @Post('return')
  @HttpCode(HttpStatus.OK)
  async returnBook(@Body() returnBookDto: ReturnBookDto): Promise<ReturnBookResult> {
    return await this.returnBookUseCase.execute(returnBookDto);
  }

  @Get('user/:userId')
  async getUserLoans(@Param('userId') userId: string): Promise<Loan[]> {
    return await this.getUserLoansUseCase.execute(userId);
  }
}
