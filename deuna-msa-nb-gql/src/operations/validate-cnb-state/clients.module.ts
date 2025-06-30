import { Module } from '@nestjs/common';
import { ClientsResolver } from './clients.resolver';
import { ClientsService } from './service/clients.service';
import { MsaNbClientModule } from '../../external-services/msa-nb-client/msa-nb-client.module';
import { MsaCoCommerceServiceModule } from '../../external-services/msa-co-commerce/msa-co-commerce-service.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaNbClientModule, MsaCoCommerceServiceModule, HttpModule],
  providers: [ClientsResolver, ClientsService],
})
export class ClientsModule {}
