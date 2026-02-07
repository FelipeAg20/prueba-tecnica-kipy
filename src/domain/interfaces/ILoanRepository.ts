import { Loan } from '../entities/Loan.entity';

export interface ILoanRepository {
  findById(id: string): Promise<Loan | null>;
  findByUserId(userId: string): Promise<Loan[]>;
  findActiveByUserId(userId: string): Promise<Loan[]>;
  findOverdueByUserId(userId: string): Promise<Loan[]>;
  findByBookId(bookId: string): Promise<Loan[]>;
  save(loan: Loan): Promise<Loan>;
  update(loan: Loan): Promise<Loan>;
  findAll(): Promise<Loan[]>;
  delete(id: string): Promise<void>;
}
