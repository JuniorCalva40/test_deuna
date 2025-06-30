import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ValidateBalanceResolver } from './validate-balance.resolver';
import { ValidateBalanceService } from './services/validate-balance.service';
import { MsaCoTransferOrchestrationServiceModule } from '../../external-services/msa-co-transfer-orchestration/msa-co-transfer-orchestration-service.module';
import { MsaBoMcClientModule } from '../../external-services/msa-mc-bo-client/msa-mc-bo-client.service.module';

@Module({
  imports: [
    HttpModule,
    MsaCoTransferOrchestrationServiceModule,
    MsaBoMcClientModule,
  ],
  providers: [ValidateBalanceResolver, ValidateBalanceService],
})
export class ValidateBalanceModule {}
