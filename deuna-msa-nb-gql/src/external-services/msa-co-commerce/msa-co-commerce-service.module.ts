import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { msaCoCommerceServiceProvider } from './providers/msa-co-commerce-provider';
import { RestMsaCoCommerceService } from './service/rest-msa-co-commerce.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [msaCoCommerceServiceProvider, RestMsaCoCommerceService],
  exports: [msaCoCommerceServiceProvider],
})
export class MsaCoCommerceServiceModule {}
