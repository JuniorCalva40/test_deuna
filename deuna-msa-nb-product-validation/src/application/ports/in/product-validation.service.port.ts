import {
  ProductValidationRequestDto,
  ProductValidationResponseDto,
} from '../../dto/product-validation.dto';

export interface ProductValidationServicePort {
  validateProduct(
    request: ProductValidationRequestDto,
  ): Promise<ProductValidationResponseDto>;
}
