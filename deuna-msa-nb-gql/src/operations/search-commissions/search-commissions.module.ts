import { Module } from '@nestjs/common';
import { SearchCommissionsService } from './services/search-commissions.service';
import { SearchCommissionsResolver } from './search-commissions.resolver';
import { HttpModule } from '@nestjs/axios';
import { MsaMcCrCommissionsModule } from 'src/external-services/deuna-msa-mc-cr-commissions/deuna-msa-mc-cr-commissions.module';

@Module({
  imports: [MsaMcCrCommissionsModule, HttpModule],
  providers: [SearchCommissionsService, SearchCommissionsResolver],
})
export class SearchCommissionsModule {}
