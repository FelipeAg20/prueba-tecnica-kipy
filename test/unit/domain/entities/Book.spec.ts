import { Book } from '../../../../src/domain/entities/Book.entity';
import { ISBN } from '../../../../src/domain/value-objects/ISBN.vo';

describe('Book Entity', () => {
  const validISBN = ISBN.create('978-0-13-468599-1');

  it('should create a valid book', () => {
    const book = new Book(
      '123e4567-e89b-12d3-a456-426614174000',
      validISBN,
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      3,
      5,
    );

    expect(book).toBeDefined();
    expect(book.title).toBe('Clean Code');
    expect(book.author).toBe('Robert C. Martin');
    expect(book.getAvailableCopies()).toBe(3);
  });

  it('should throw error if ISBN is invalid', () => {
    expect(() => {
      ISBN.create('invalid-isbn');
    }).toThrow('Invalid ISBN format');
  });

  it('should decrease available copies when loaned', () => {
    const book = new Book(
      '123e4567-e89b-12d3-a456-426614174000',
      validISBN,
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      3,
      5,
    );

    book.decreaseAvailableCopies();
    expect(book.getAvailableCopies()).toBe(2);

    book.decreaseAvailableCopies();
    expect(book.getAvailableCopies()).toBe(1);
  });

  it('should increase available copies when returned', () => {
    const book = new Book(
      '123e4567-e89b-12d3-a456-426614174000',
      validISBN,
      'Clean Code',
      'Robert C. Martin',
      2008,
      'Software Engineering',
      2,
      5,
    );

    book.increaseAvailableCopies();
    expect(book.getAvailableCopies()).toBe(3);
  });
});
