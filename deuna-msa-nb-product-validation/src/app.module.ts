import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MambuModule } from '@deuna/tl-mambu-nd';
import { ProductValidationController } from './infrastructure/adapters/controllers/product-validation.controller';
import { ProductValidationService } from './application/services/product-validation.service';
import { PRODUCT_VALIDATION_PORT } from './domain/constants/injection.constants';
import { MAMBU_CLIENT_PORT } from './domain/constants/injection.constants';
import { ValidateProductUseCase } from './application/use-cases/validate-product.use-case';
import { MambuClientAdapter } from './infrastructure/adapters/clients/mambu-client.adapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MambuModule.register({
      context: 'Microservice Product Validation Service',
      domain: process.env.MAMBU_DOMAIN!,
      apikey: process.env.MAMBU_APIKEY!,
    }),
  ],
  controllers: [ProductValidationController],
  providers: [
    ValidateProductUseCase,
    {
      provide: PRODUCT_VALIDATION_PORT,
      useClass: ProductValidationService,
    },
    {
      provide: MAMBU_CLIENT_PORT,
      useClass: MambuClientAdapter,
    },
  ],
})
export class AppModule {}
