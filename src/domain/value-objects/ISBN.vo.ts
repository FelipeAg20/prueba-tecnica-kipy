export class ISBN {
  private readonly value: string;

  private constructor(isbn: string) {
    this.value = isbn;
  }

  public static create(isbn: string): ISBN {
    if (!ISBN.isValid(isbn)) {
      throw new Error('Invalid ISBN format. Must be ISBN-10 or ISBN-13');
    }
    return new ISBN(isbn);
  }

  public static isValid(isbn: string): boolean {
    // Remove hyphens and spaces
    const cleaned = isbn.replace(/[-\s]/g, '');

    // Check if it's ISBN-10 or ISBN-13
    if (cleaned.length === 10) {
      return ISBN.validateISBN10(cleaned);
    } else if (cleaned.length === 13) {
      return ISBN.validateISBN13(cleaned);
    }

    return false;
  }

  private static validateISBN10(isbn: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const digit = parseInt(isbn[i], 10);
      if (isNaN(digit)) return false;
      sum += digit * (10 - i);
    }

    const lastChar = isbn[9];
    const checkDigit = lastChar === 'X' ? 10 : parseInt(lastChar, 10);
    if (isNaN(checkDigit) && lastChar !== 'X') return false;

    sum += checkDigit;
    return sum % 11 === 0;
  }

  private static validateISBN13(isbn: string): boolean {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn[i], 10);
      if (isNaN(digit)) return false;
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = parseInt(isbn[12], 10);
    if (isNaN(checkDigit)) return false;

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return checkDigit === calculatedCheck;
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: ISBN): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
