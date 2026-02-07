import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('loans')
export class LoanEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  bookId!: string;

  @Column('uuid')
  userId!: string;

  @Column()
  loanDate!: Date;

  @Column()
  expectedReturnDate!: Date;

  @Column({ nullable: true })
  returnDate!: Date | null;

  @Column()
  status!: string; // 'ACTIVE' | 'RETURNED' | 'OVERDUE'

  @Column()
  userType!: string; // 'STUDENT' | 'TEACHER' | 'ADMIN'
}
