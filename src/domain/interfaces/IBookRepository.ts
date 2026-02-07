import { Book } from '../entities/Book.entity';

export interface IBookRepository {
  findById(id: string): Promise<Book | null>;
  findByISBN(isbn: string): Promise<Book | null>;
  save(book: Book): Promise<Book>;
  update(book: Book): Promise<Book>;
  findAll(): Promise<Book[]>;
  delete(id: string): Promise<void>;
}
