import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { msaBoMcClientServiceProvider } from './providers/msa-mc-bo-client.provider';
import { RestMsaMcBoClientService } from './service/rest-msa-mc-bo-client.service';
@Module({
  imports: [HttpModule],
  providers: [msaBoMcClientServiceProvider, RestMsaMcBoClientService],
  exports: [msaBoMcClientServiceProvider],
})
export class MsaBoMcClientModule {}
