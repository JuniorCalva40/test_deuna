import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { StartBiometricValidationResolver } from './start-biometric-validation.resolver';
import { StartBiometricValidationService } from './services/start-biometric-validation.service';
import { MsaNbCnbOrqModule } from '../../external-services/msa-nb-cnb-orq/msa-nb-cnb-orq.module';

@Module({
  imports: [HttpModule, ConfigModule, MsaNbCnbOrqModule],
  providers: [
    StartBiometricValidationResolver,
    StartBiometricValidationService,
  ],
})
export class StartMorphologyValidationModule {}
