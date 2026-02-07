import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('books')
export class BookEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  isbn!: string;

  @Column()
  title!: string;

  @Column()
  author!: string;

  @Column()
  publicationYear!: number;

  @Column()
  category!: string;

  @Column()
  availableCopies!: number;

  @Column()
  totalCopies!: number;
}
