import { Module } from '@nestjs/common';
import { CnbClientsResolver } from './query-cnbClients.resolver';
import { CnbClientsService } from './service/query-cnbClients.service';
import { MsaNbClientModule } from '../../external-services/msa-nb-cnb-service/msa-nb-client.module';
import { MsaCoCommerceServiceModule } from '../../external-services/msa-co-commerce/msa-co-commerce-service.module';
import { HttpModule } from '@nestjs/axios';
import { MsaBoMcClientModule } from '../../external-services/msa-mc-bo-client/msa-mc-bo-client.service.module';
import { MsaMcBoHierarchyModule } from '../../external-services/msa-mc-bo-hierarchy/msa-mc-bo-hierarchy.module';
import { DeunaMsaMcBoConfigurationModule } from '../../external-services/msa-mc-bo-configuration/deuna-msa-mc-bo-configuration.module';
import { MsaTlBpDataProviderModule } from '../../external-services/msa-tl-bp-data-provider/msa-tl-bp-data-provider.module';
import { MsaNbCnbOrqModule } from '../../external-services/msa-nb-cnb-orq/msa-nb-cnb-orq.module';

@Module({
  imports: [
    MsaNbClientModule,
    MsaCoCommerceServiceModule,
    MsaBoMcClientModule,
    MsaMcBoHierarchyModule,
    DeunaMsaMcBoConfigurationModule,
    HttpModule,
    MsaTlBpDataProviderModule,
    MsaNbCnbOrqModule,
  ],
  providers: [CnbClientsResolver, CnbClientsService],
})
export class CnbClientsModule {}
