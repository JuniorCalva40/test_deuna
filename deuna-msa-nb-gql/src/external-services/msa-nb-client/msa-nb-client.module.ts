import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import {
  msaNbClientServiceProvider,
  MSA_NB_CLIENT_SERVICE,
} from './providers/msa-nb-client-service.provider';
import { RestMsaNbClientService } from './services/rest-msa-nb-client.service';
import { FakeMsaNbClientService } from './services/fake-msa-nb-client.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    msaNbClientServiceProvider,
    RestMsaNbClientService,
    FakeMsaNbClientService,
  ],
  exports: [MSA_NB_CLIENT_SERVICE],
})
export class MsaNbClientModule {}
