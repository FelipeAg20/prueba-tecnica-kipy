import { Inject, Injectable } from '@nestjs/common';
import { BookRepository } from '../../infrastructure/repositories/BookRepository';
import { IBookRepository } from '../../domain/interfaces/IBookRepository';

export interface BookAvailability {
  bookId: string;
  title: string;
  availableCopies: number;
  totalCopies: number;
  isAvailable: boolean;
}

@Injectable()
export class CheckBookAvailabilityUseCase {
  constructor(
    @Inject(BookRepository)
    private readonly bookRepository: IBookRepository,
  ) {}

  async execute(bookId: string): Promise<BookAvailability> {
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    return {
      bookId: book.id,
      title: book.title,
      availableCopies: book.getAvailableCopies(),
      totalCopies: book.totalCopies,
      isAvailable: book.hasAvailableCopies(),
    };
  }
}
