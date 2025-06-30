import { Module } from '@nestjs/common';
import { MsaTlBpDataProviderService } from './services/msa-tl-bp-data-provider.service';
import { msaTlBpDataProvider } from './providers/msa-tl-bp-data-provider';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MsaTlBpDataProviderService, msaTlBpDataProvider],
  exports: [msaTlBpDataProvider],
})
export class MsaTlBpDataProviderModule {}
