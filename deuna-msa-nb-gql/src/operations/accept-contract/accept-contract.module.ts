import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AcceptContractResolver } from './accept-contract.resolver';
import { AcceptContractService } from './services/accept-contract.service';
import { MsaNbOnboardingStatusServiceModule } from '../../external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { MsaCoAuthModule } from 'src/external-services/msa-co-auth/msa-co-auth.module';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';

@Module({
  imports: [HttpModule, MsaNbOnboardingStatusServiceModule, MsaCoAuthModule],
  providers: [
    AcceptContractResolver,
    AcceptContractService,
    GetUserPersonGuard,
  ],
})
export class AcceptContractModule {}
