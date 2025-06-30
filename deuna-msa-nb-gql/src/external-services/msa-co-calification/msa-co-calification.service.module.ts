import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RestMsaCoCalificationService } from './service/rest-msa-co-calification.service';
import { msaCoCalificationServiceProvider } from './providers/msa-co-calification.provider';

@Module({
  imports: [HttpModule],
  providers: [msaCoCalificationServiceProvider, RestMsaCoCalificationService],
  exports: [msaCoCalificationServiceProvider],
})
export class MsaCoCalificationModule {}
