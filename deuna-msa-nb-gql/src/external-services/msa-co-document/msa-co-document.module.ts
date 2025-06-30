import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import {
  msaCoDocumentServiceProvider,
  MSA_CO_DOCUMENT_SERVICE,
} from './providers/msa-co-document.provider';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [msaCoDocumentServiceProvider],
  exports: [MSA_CO_DOCUMENT_SERVICE],
})
export class MsaCoDocumentModule {}
