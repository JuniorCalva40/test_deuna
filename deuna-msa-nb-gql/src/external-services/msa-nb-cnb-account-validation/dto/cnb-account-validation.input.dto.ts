import { IsString, IsNotEmpty, IsFloat } from 'class-validator';

export class CnbAccountValidationInputDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string;
} 