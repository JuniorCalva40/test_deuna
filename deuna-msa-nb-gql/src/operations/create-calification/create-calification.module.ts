import { Module } from '@nestjs/common';
import { CreateCalificationResolver } from './create-calification.resolver';
import { CreateCalificationService } from './service/create-calification.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MSA_CO_CALIFICATION_SERVICE } from '../../external-services/msa-co-calification/interfaces/msa-co-calification-service.interface';
import { RestMsaCoCalificationService } from '../../external-services/msa-co-calification/service/rest-msa-co-calification.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    CreateCalificationResolver,
    CreateCalificationService,
    {
      provide: MSA_CO_CALIFICATION_SERVICE,
      useClass: RestMsaCoCalificationService,
    },
  ],
})
export class CreateCalificationModule {}
