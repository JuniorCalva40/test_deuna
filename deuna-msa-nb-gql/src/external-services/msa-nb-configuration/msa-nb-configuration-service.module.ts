import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import {
  msaNbConfigurationServiceProvider,
  MSA_NB_CONFIGURATION_SERVICE,
} from './providers/msa-nb-configuration-provider';
import { RestMsaNbConfigurationService } from './services/rest-msa-nb-configuration.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [msaNbConfigurationServiceProvider, RestMsaNbConfigurationService],
  exports: [MSA_NB_CONFIGURATION_SERVICE],
})
export class MsaNbConfigurationServiceModule {}
