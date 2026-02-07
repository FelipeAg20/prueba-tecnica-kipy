import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateLoanDto {
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  bookId!: string;

  @IsNotEmpty()
  @IsUUID()
  @IsString()
  userId!: string;
}
