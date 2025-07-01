import { Injectable } from '@nestjs/common';
import {
  ProductValidationRequestDto,
  ProductValidationResponseDto,
} from '../dto/product-validation.dto';
import { ValidateProductUseCase } from '../use-cases/validate-product.use-case';
import { ProductValidationServicePort } from '../ports/in/product-validation.service.port';

@Injectable()
export class ProductValidationService implements ProductValidationServicePort {
  constructor(
    private readonly validateProductUseCase: ValidateProductUseCase,
  ) {}

  async validateProduct(
    request: ProductValidationRequestDto,
  ): Promise<ProductValidationResponseDto> {
    return await this.validateProductUseCase.execute(request);
  }
}
