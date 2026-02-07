import { IsNotEmpty, IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class ReturnBookDto {
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  loanId!: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string; // ISO 8601 format
}
