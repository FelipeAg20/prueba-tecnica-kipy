import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILoanRepository } from '../../domain/interfaces/ILoanRepository';
import { Loan } from '../../domain/entities/Loan.entity';
import { LoanEntity } from '../database/entities/LoanEntity';
import { LoanStatus } from '../../domain/entities/LoanStatus.enum';
import { UserType } from '../../domain/entities/UserType.enum';

@Injectable()
export class LoanRepository implements ILoanRepository {
  constructor(
    @InjectRepository(LoanEntity)
    private readonly loanEntityRepository: Repository<LoanEntity>,
  ) {}

  async findById(id: string): Promise<Loan | null> {
    const entity = await this.loanEntityRepository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return this.toDomain(entity);
  }

  async findByUserId(userId: string): Promise<Loan[]> {
    const entities = await this.loanEntityRepository.find({ where: { userId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findActiveByUserId(userId: string): Promise<Loan[]> {
    const entities = await this.loanEntityRepository.find({
      where: { userId, status: LoanStatus.ACTIVE },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findOverdueByUserId(userId: string): Promise<Loan[]> {
    const entities = await this.loanEntityRepository.find({
      where: { userId, status: LoanStatus.OVERDUE },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByBookId(bookId: string): Promise<Loan[]> {
    const entities = await this.loanEntityRepository.find({ where: { bookId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(loan: Loan): Promise<Loan> {
    const entity = this.toEntity(loan);
    const saved = await this.loanEntityRepository.save(entity);
    return this.toDomain(saved);
  }

  async update(loan: Loan): Promise<Loan> {
    const entity = this.toEntity(loan);
    const saved = await this.loanEntityRepository.save(entity);
    return this.toDomain(saved);
  }

  async findAll(): Promise<Loan[]> {
    const entities = await this.loanEntityRepository.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.loanEntityRepository.delete(id);
  }

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

  private toEntity(loan: Loan): LoanEntity {
    const entity = new LoanEntity();
    entity.id = loan.id;
    entity.bookId = loan.bookId;
    entity.userId = loan.userId;
    entity.loanDate = loan.loanDate;
    entity.expectedReturnDate = loan.expectedReturnDate;
    entity.returnDate = loan.getReturnDate();
    entity.status = loan.getStatus();
    entity.userType = loan.getUserType();
    return entity;
  }
}
