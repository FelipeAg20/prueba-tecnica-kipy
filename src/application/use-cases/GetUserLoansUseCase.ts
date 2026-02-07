import { Inject, Injectable } from '@nestjs/common';
import { LoanRepository } from '../../infrastructure/repositories/LoanRepository';
import { Loan } from '../../domain/entities/Loan.entity';
import { ILoanRepository } from '../../domain/interfaces/ILoanRepository';

@Injectable()
export class GetUserLoansUseCase {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: ILoanRepository,
  ) {}

  async execute(userId: string): Promise<Loan[]> {
    return await this.loanRepository.findByUserId(userId);
  }
}
