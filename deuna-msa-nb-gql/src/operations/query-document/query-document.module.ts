import { Module } from '@nestjs/common';
import { QueryDocumentResolver } from './query-document.resolver';
import { QueryDocumentService } from './services/query-document.service';
import { MsaCoDocumentModule } from '../../external-services/msa-co-document/msa-co-document.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MsaCoDocumentModule, HttpModule],
  providers: [QueryDocumentResolver, QueryDocumentService],
})
export class QueryDocumentModule {}
