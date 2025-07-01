import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ProductValidationRequestDto,
  ProductValidationResponseDto,
} from '../../../application/dto/product-validation.dto';
import { ProductValidationServicePort } from '../../../application/ports/in/product-validation.service.port';
import { PRODUCT_VALIDATION_PORT } from 'src/domain/constants/injection.constants';

@Controller('product-validation')
export class ProductValidationController {
  constructor(
    @Inject(PRODUCT_VALIDATION_PORT)
    private readonly productValidationService: ProductValidationServicePort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async validateProduct(
    @Body() request: ProductValidationRequestDto,
  ): Promise<ProductValidationResponseDto> {
    try {
      const result =
        await this.productValidationService.validateProduct(request);

      return result;
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: [
          {
            code: 'VALIDATION_ERROR',
            message: 'An error occurred during validation',
          },
        ],
      };
    }
  }
}
