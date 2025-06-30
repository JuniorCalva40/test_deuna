import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import {
  msaNbCnbAccountValidationServiceProvider,
  MSA_NB_CNB_ACCOUNT_VALIDATION_SERVICE,
} from './providers/msa-nb-cnb-account-validation-service.provider';
import { RestMsaNbCnbAccountValidationService } from './services/rest-msa-nb-cnb-account-validation.service';
import { FakeMsaNbCnbAccountValidationService } from './services/fake-msa-nb-cnb-account-validation.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    msaNbCnbAccountValidationServiceProvider,
    RestMsaNbCnbAccountValidationService,
    FakeMsaNbCnbAccountValidationService,
  ],
  exports: [MSA_NB_CNB_ACCOUNT_VALIDATION_SERVICE],
})
export class MsaNbCnbAccountValidationModule {} 