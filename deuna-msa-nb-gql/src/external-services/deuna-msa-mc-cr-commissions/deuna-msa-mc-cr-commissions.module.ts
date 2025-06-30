import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MsaMcCrCommissionsService } from './services/deuna-msa-mc-cr-commissions.service';
import { msaMcCrCommissionsProvider } from './providers/deuna-msa-mc-cr-commissions.provider';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [msaMcCrCommissionsProvider, MsaMcCrCommissionsService],
  exports: [msaMcCrCommissionsProvider],
})
export class MsaMcCrCommissionsModule {}
