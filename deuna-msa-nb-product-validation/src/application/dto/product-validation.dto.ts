import {
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  Min,
  IsOptional,
} from 'class-validator';
import { ValidationType } from 'src/domain/port/product-validation.port';

export class ProductValidationRequestDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsEnum(ValidationType)
  validationType: ValidationType;
}

export class ProductValidationResponseDto {
  isValid: boolean;
  errors: ValidationErrorDto[];
  accountId?: string;
  accountNumber?: string;
  availableBalance?: number;
  requestedAmount?: number;
  accountStatus?: string;
}

export class ValidationErrorDto {
  code: string;
  message: string;
  field?: string;
}
