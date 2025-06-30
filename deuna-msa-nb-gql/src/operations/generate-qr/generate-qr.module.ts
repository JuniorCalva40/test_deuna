import { Module } from '@nestjs/common';
import { GenerateQrResolver } from './generate-qr.resolver';
import { GenerateQrService } from './services/generate-qr.service';
import { HttpModule } from '@nestjs/axios';
import { MsaNbAliasManagementModule } from '../../external-services/msa-nb-alias-management/msa-nb-alias-management.module';

@Module({
  imports: [HttpModule, MsaNbAliasManagementModule],
  providers: [GenerateQrResolver, GenerateQrService],
})
export class GenerateQrModule {}
