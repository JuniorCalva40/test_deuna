import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import {
  msaCoTransferOrchestrationServiceProvider,
  MSA_CO_TRANSFER_ORCHESTRATION_SERVICE,
} from './providers/msa-co-transfer-orchestration-provider';
import { RestMsaCoTransferOrchestrationService } from './services/rest-msa-co-transfer-orchestration.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    msaCoTransferOrchestrationServiceProvider,
    RestMsaCoTransferOrchestrationService,
  ],
  exports: [MSA_CO_TRANSFER_ORCHESTRATION_SERVICE],
})
export class MsaCoTransferOrchestrationServiceModule {}
