import { Module } from '@nestjs/common';
import { QueryDocumentResolver } from './query-document.resolver';
import { QueryDocumentService } from './services/query-document.service';
import { MsaNbCnbOrqModule } from 'src/external-services/msa-nb-cnb-orq/msa-nb-cnb-orq.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaNbCnbOrqModule, HttpModule],
  providers: [QueryDocumentResolver, QueryDocumentService],
})
export class QueryDocumentModule {}
