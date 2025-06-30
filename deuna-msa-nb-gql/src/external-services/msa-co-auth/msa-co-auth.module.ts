import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import {
  msaCoAuthServiceProvider,
  MSA_CO_AUTH_SERVICE,
} from './providers/msa-co-auth.provider';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [msaCoAuthServiceProvider],
  exports: [MSA_CO_AUTH_SERVICE],
})
export class MsaCoAuthModule {}
