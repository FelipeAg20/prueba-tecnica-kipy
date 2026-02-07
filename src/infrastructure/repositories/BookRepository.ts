import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBookRepository } from '../../domain/interfaces/IBookRepository';
import { Book } from '../../domain/entities/Book.entity';
import { BookEntity } from '../database/entities/BookEntity';
import { ISBN } from '../../domain/value-objects/ISBN.vo';

@Injectable()
export class BookRepository implements IBookRepository {
  constructor(
    @InjectRepository(BookEntity)
    private readonly bookEntityRepository: Repository<BookEntity>,
  ) {}

  async findById(id: string): Promise<Book | null> {
    const entity = await this.bookEntityRepository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return this.toDomain(entity);
  }

  async findByISBN(isbn: string): Promise<Book | null> {
    const entity = await this.bookEntityRepository.findOne({ where: { isbn } });
    if (!entity) {
      return null;
    }
    return this.toDomain(entity);
  }

  async save(book: Book): Promise<Book> {
    const entity = this.toEntity(book);
    const saved = await this.bookEntityRepository.save(entity);
    return this.toDomain(saved);
  }

  async update(book: Book): Promise<Book> {
    const entity = this.toEntity(book);
    const saved = await this.bookEntityRepository.save(entity);
    return this.toDomain(saved);
  }

  async findAll(): Promise<Book[]> {
    const entities = await this.bookEntityRepository.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.bookEntityRepository.delete(id);
  }

  private toDomain(entity: BookEntity): Book {
    return new Book(
      entity.id,
      ISBN.create(entity.isbn),
      entity.title,
      entity.author,
      entity.publicationYear,
      entity.category,
      entity.availableCopies,
      entity.totalCopies,
    );
  }

  private toEntity(book: Book): BookEntity {
    const entity = new BookEntity();
    entity.id = book.id;
    entity.isbn = book.isbn.getValue();
    entity.title = book.title;
    entity.author = book.author;
    entity.publicationYear = book.publicationYear;
    entity.category = book.category;
    entity.availableCopies = book.getAvailableCopies();
    entity.totalCopies = book.totalCopies;
    return entity;
  }
}
